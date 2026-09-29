import { useEffect, useRef, useState } from 'react'
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
  const selectedRef = useRef(selected)
  const onSelectRef = useRef(onSelect)
  selectedRef.current = selected
  onSelectRef.current = onSelect
  const [half, setHalf] = useState(0)

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

  const centerItem = (id: string, smooth: boolean) => {
    const el = ref.current
    if (!el) return
    const t = el.querySelector<HTMLElement>(`[data-id="${id}"]`)
    if (!t) return
    el.scrollTo({
      left: t.offsetLeft + t.clientWidth / 2 - el.clientWidth / 2,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }

  const pickCenter = (settle: boolean) => {
    const el = ref.current
    if (!el) return
    const center = el.scrollLeft + el.clientWidth / 2
    let best: string | null = null
    let bestD = Infinity
    el.querySelectorAll<HTMLElement>('[data-id]').forEach((c) => {
      const d = Math.abs(c.offsetLeft + c.clientWidth / 2 - center)
      if (d < bestD) {
        bestD = d
        best = c.dataset.id ?? null
      }
    })
    if (!best) return
    if (best !== selectedRef.current) onSelectRef.current(best)
    if (settle && bestD > 4) centerItem(best, true)
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setHalf(el.clientWidth / 2)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    if (half > 0) {
      centerItem(selected, false)
      const t = window.setTimeout(() => centerItem(selected, false), 250)
      return () => window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [half, dates.length])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      stopMomentum()
      el.scrollLeft += (e.deltaY + e.deltaX) * 2
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const onScroll = () => {
    if (pickRaf.current) cancelAnimationFrame(pickRaf.current)
    pickRaf.current = requestAnimationFrame(() => pickCenter(false))
    if (state.current.down) return
    window.clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => {
      if (!momentumRaf.current && !state.current.down) pickCenter(true)
    }, 160)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const el = ref.current
    if (!el) return
    stopMomentum()
    window.clearTimeout(settleTimer.current)
    el.scrollTo({ left: el.scrollLeft, behavior: 'auto' })
    const s = state.current
    s.down = true
    s.startX = e.clientX
    s.lastX = e.clientX
    s.lastT = performance.now()
    s.scrollStart = el.scrollLeft
    s.moved = false
    s.vel = 0

    const move = (ev: PointerEvent) => {
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
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
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
          }
        }
        momentumRaf.current = requestAnimationFrame(step)
      }
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
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
        className="no-scrollbar flex cursor-grab select-none items-start gap-6 overflow-x-auto overscroll-x-contain py-4 [touch-action:pan-x] active:cursor-grabbing"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
        }}
      >
        <div style={{ width: half }} className="shrink-0" />
        {items.map((it) => {
          const active = selected === it.id
          return (
            <button
              key={it.id}
              data-id={it.id}
              onClick={() => {
                onSelect(it.id)
                centerItem(it.id, true)
              }}
              className={`flex shrink-0 flex-col items-center gap-1 transition-transform duration-150 ${
                active ? 'scale-125' : 'scale-100'
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
        <div style={{ width: half }} className="shrink-0" />
      </div>
    </div>
  )
}
