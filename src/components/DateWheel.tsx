import { useEffect, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'

interface Props {
  dates: string[]
  selected: string
  onSelect: (d: string | 'all') => void
}

export default function DateWheel({ dates, selected, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const state = useRef({
    down: false,
    startX: 0,
    scrollStart: 0,
    lastX: 0,
    lastT: 0,
    moved: false,
    vel: 0,
  })
  const momentumRaf = useRef<number | null>(null)
  const pickRaf = useRef<number | null>(null)
  const settleTimer = useRef<number | undefined>(undefined)
  const targetIdx = useRef<number | null>(null)
  const settling = useRef(false)
  const selectedRef = useRef(selected)
  const onSelectRef = useRef(onSelect)
  selectedRef.current = selected
  onSelectRef.current = onSelect

  const items: { id: string | 'all'; label: string; sub: string }[] = [
    { id: 'all', label: 'All', sub: 'dates' },
    ...dates.map((d) => {
      const dt = new Date(`${d}T00:00:00`)
      return {
        id: d,
        label: String(dt.getDate()),
        sub: dt.toLocaleDateString('en-GB', { weekday: 'short', month: 'short' }),
      }
    }),
  ]

  const stopMomentum = () => {
    if (momentumRaf.current) cancelAnimationFrame(momentumRaf.current)
    momentumRaf.current = null
  }

  const cancelSettle = () => {
    if (settling.current) {
      settling.current = false
      const el = ref.current
      if (el) el.scrollTo({ left: el.scrollLeft, behavior: 'auto' })
    }
  }

  const children = (): HTMLElement[] => {
    const el = ref.current
    if (!el) return []
    return Array.from(el.querySelectorAll<HTMLElement>('[data-id]'))
  }

  const itemCenter = (el: HTMLElement, c: HTMLElement) => {
    const elRect = el.getBoundingClientRect()
    const cRect = c.getBoundingClientRect()
    return el.scrollLeft + (cRect.left - elRect.left) + cRect.width / 2
  }

  const nearestIndex = () => {
    const el = ref.current
    if (!el) return 0
    const list = children()
    if (list.length === 0) return 0
    const center = el.scrollLeft + el.clientWidth / 2
    let best = 0
    let bestD = Infinity
    list.forEach((c, i) => {
      const d = Math.abs(itemCenter(el, c) - center)
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    return best
  }

  const centerToIndex = (idx: number, smooth: boolean) => {
    const el = ref.current
    const list = children()
    const t = list[idx]
    if (!el || !t) return
    const target = itemCenter(el, t) - el.clientWidth / 2
    const max = el.scrollWidth - el.clientWidth
    const clamped = Math.max(0, Math.min(max, target))
    if (smooth) settling.current = true
    el.scrollTo({ left: clamped, behavior: smooth ? 'smooth' : 'auto' })
  }

  const centerItem = (id: string, smooth: boolean) => {
    const list = children()
    const idx = list.findIndex((c) => c.dataset.id === id)
    if (idx < 0) return
    targetIdx.current = idx
    centerToIndex(idx, smooth)
  }

  const pickLive = () => {
    const list = children()
    if (list.length === 0) return
    const idx = nearestIndex()
    const id = list[idx].dataset.id ?? null
    if (!id) return
    targetIdx.current = idx
    if (id !== selectedRef.current) onSelectRef.current(id as string | 'all')
  }

  const snapToNearest = (smooth: boolean) => {
    const el = ref.current
    const list = children()
    if (!el || list.length === 0) return
    const idx = nearestIndex()
    const id = list[idx].dataset.id ?? null
    if (!id) return
    targetIdx.current = idx
    if (id !== selectedRef.current) onSelectRef.current(id as string | 'all')
    const center = el.scrollLeft + el.clientWidth / 2
    if (Math.abs(itemCenter(el, list[idx]) - center) > 2) {
      centerToIndex(idx, smooth)
    } else {
      settling.current = false
    }
  }

  const scheduleSettle = (delay = 140) => {
    window.clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => {
      if (state.current.down) return
      if (momentumRaf.current) return
      snapToNearest(true)
    }, delay)
  }

  useEffect(() => {
    if (dates.length > 0) {
      targetIdx.current = null
      settling.current = false
      centerItem(selectedRef.current, false)
      const t = window.setTimeout(() => {
        settling.current = false
        centerItem(selectedRef.current, false)
      }, 250)
      return () => window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates.length])

  useEffect(() => {
    return () => {
      stopMomentum()
      if (pickRaf.current) cancelAnimationFrame(pickRaf.current)
      window.clearTimeout(settleTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      stopMomentum()
      window.clearTimeout(settleTimer.current)
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      const mult = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 200 : 1
      const d = delta * mult
      if (!d) return
      if (Math.abs(d) >= 50) {
        cancelSettle()
        const list = children()
        if (list.length === 0) return
        const base = targetIdx.current ?? nearestIndex()
        const dir = d > 0 ? 1 : -1
        const next = Math.max(0, Math.min(list.length - 1, base + dir))
        targetIdx.current = next
        const id = list[next].dataset.id as string | 'all'
        if (id && id !== selectedRef.current) onSelectRef.current(id)
        centerToIndex(next, true)
        scheduleSettle(200)
      } else {
        cancelSettle()
        targetIdx.current = null
        el.scrollLeft += d * 1.5
        scheduleSettle(140)
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onScroll = () => {
    const el = ref.current
    if (!el) return
    if (pickRaf.current) cancelAnimationFrame(pickRaf.current)
    pickRaf.current = requestAnimationFrame(() => {
      if (!settling.current && !state.current.down && !momentumRaf.current) pickLive()
    })
    if (state.current.down) return
    if (momentumRaf.current) return
    if (settling.current) {
      scheduleSettle(180)
      return
    }
    scheduleSettle(140)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const el = ref.current
    if (!el) return
    stopMomentum()
    cancelSettle()
    window.clearTimeout(settleTimer.current)
    targetIdx.current = null
    const s = state.current
    s.down = true
    s.startX = e.clientX
    s.lastX = e.clientX
    s.lastT = performance.now()
    s.scrollStart = el.scrollLeft
    s.moved = false
    s.vel = 0

    const move = (ev: MouseEvent) => {
      if (!s.down) return
      const total = ev.clientX - s.startX
      if (Math.abs(total) > 5) s.moved = true
      el.scrollLeft = s.scrollStart - total
      const now = performance.now()
      const dt = now - s.lastT
      if (dt > 0) s.vel = Math.max(-3, Math.min(3, (s.lastX - ev.clientX) / dt))
      s.lastX = ev.clientX
      s.lastT = now
    }

    const up = () => {
      if (!s.down) return
      s.down = false
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      if (Math.abs(s.vel) > 0.15) {
        let last = performance.now()
        const step = (now: number) => {
          const dt = Math.min(now - last, 64)
          last = now
          s.vel *= Math.pow(0.96, dt / 16.7)
          const before = el.scrollLeft
          el.scrollLeft += s.vel * dt
          if (Math.abs(s.vel) > 0.02 && el.scrollLeft !== before) {
            momentumRaf.current = requestAnimationFrame(step)
          } else {
            momentumRaf.current = null
            snapToNearest(true)
          }
        }
        momentumRaf.current = requestAnimationFrame(step)
      } else {
        snapToNearest(true)
      }
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  const onClickCapture = (e: ReactMouseEvent) => {
    if (state.current.moved) {
      e.preventDefault()
      e.stopPropagation()
      state.current.moved = false
    }
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-1/2 top-0 z-10 h-2 w-px -translate-x-1/2 bg-accent" />
      <div
        ref={ref}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
        className="wheel-mask no-scrollbar flex cursor-grab select-none items-start gap-6 overflow-x-auto overscroll-x-contain py-4 [touch-action:pan-x] active:cursor-grabbing"
      >
        <div className="w-[45%] shrink-0" />
        {items.map((it) => {
          const active = selected === it.id
          return (
            <button
              key={it.id}
              data-id={it.id}
              onClick={() => {
                stopMomentum()
                cancelSettle()
                window.clearTimeout(settleTimer.current)
                onSelect(it.id)
                centerItem(it.id, true)
                scheduleSettle(220)
              }}
              className={`flex shrink-0 flex-col items-center gap-1 transition-transform duration-150 ${
                active ? 'scale-125 md:scale-100' : 'scale-100'
              }`}
            >
              <span className={`w-px ${active ? 'h-8 bg-accent' : 'h-4 bg-line'}`} />
              <span className={`font-display text-xl tracking-tight ${active ? 'text-white' : 'text-muted'}`}>
                {it.label}
              </span>
              <span className={`text-[10px] uppercase tracking-widest ${active ? 'text-accent' : 'text-muted'}`}>
                {it.sub}
              </span>
            </button>
          )
        })}
        <div className="w-[45%] shrink-0" />
      </div>
    </div>
  )
}
