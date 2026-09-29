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
    moved: false,
  })
  const selTimer = useRef<number | undefined>(undefined)
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

  // Wheel steps whole items (camera-dial feel); CSS snap-mandatory
  // covers touch/drag. JS only syncs selection to centered item.
  const getItems = (): HTMLElement[] => {
    const el = ref.current
    if (!el) return []
    return Array.from(el.querySelectorAll<HTMLElement>('[data-id]'))
  }

  const syncSelection = () => {
    const el = ref.current
    if (!el) return
    const list = getItems()
    if (list.length === 0) return
    const center = el.scrollLeft + el.clientWidth / 2
    let best: string | null = null
    let bestD = Infinity
    for (const c of list) {
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center)
      if (d < bestD) {
        bestD = d
        best = c.dataset.id ?? null
      }
    }
    if (best && best !== selectedRef.current) onSelectRef.current(best as string | 'all')
  }

  const scheduleSync = () => {
    window.clearTimeout(selTimer.current)
    selTimer.current = window.setTimeout(syncSelection, 60)
  }

  const centerId = (id: string) => {
    const el = ref.current
    if (!el) return
    const t = el.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`)
    if (!t) return
    // scrollIntoView honors CSS scroll-snap + smooth behavior natively
    t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  useEffect(() => {
    if (dates.length > 0) {
      const t1 = window.setTimeout(() => {
        const el = ref.current
        if (!el) return
        const t = el.querySelector<HTMLElement>(`[data-id="${CSS.escape(selectedRef.current)}"]`)
        if (t) t.scrollIntoView({ inline: 'center', block: 'nearest' })
      }, 50)
      const t2 = window.setTimeout(() => {
        const el = ref.current
        if (!el) return
        const t = el.querySelector<HTMLElement>(`[data-id="${CSS.escape(selectedRef.current)}"]`)
        if (t) t.scrollIntoView({ inline: 'center', block: 'nearest' })
      }, 300)
      return () => {
        window.clearTimeout(t1)
        window.clearTimeout(t2)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates.length])

  useEffect(() => {
    return () => {
      window.clearTimeout(selTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Wheel: accumulate deltas and step whole items (camera-dial feel).
  // scrollTo with behavior:'auto' jumps instantly so it can never
  // rest between dates; CSS snap covers touch/drag.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let acc = 0
    let accTimer: number | undefined
    const STEP = 80 // ~1 item spacing: 1 notch ≈ 1 date
    const reset = () => {
      accTimer = window.setTimeout(() => {
        acc = 0
      }, 180)
    }
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return // pinch-zoom: leave to browser
      const mult = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? el.clientWidth : 1
      const dx = e.deltaX * mult
      const dy = e.deltaY * mult
      const d = Math.abs(dx) > Math.abs(dy) ? dx : dy
      if (!d) return
      // At either edge, let the page scroll instead of trapping it.
      const max = el.scrollWidth - el.clientWidth
      if ((el.scrollLeft <= 0 && d < 0) || (el.scrollLeft >= max - 1 && d > 0)) {
        acc = 0
        return
      }
      e.preventDefault()
      window.clearTimeout(accTimer)
      acc += d
      const steps = Math.trunc(acc / STEP)
      if (steps !== 0) {
        acc -= steps * STEP
        const list = getItems()
        if (list.length === 0) return
        const center = el.scrollLeft + el.clientWidth / 2
        let base = 0
        let bestD = Infinity
        list.forEach((c, i) => {
          const dd = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center)
          if (dd < bestD) {
            bestD = dd
            base = i
          }
        })
        const next = Math.max(0, Math.min(list.length - 1, base + steps))
        const t = list[next]
        const target = t.offsetLeft + t.offsetWidth / 2 - el.clientWidth / 2
        el.scrollTo({ left: target, behavior: 'auto' })
        const id = t.dataset.id
        if (id && id !== selectedRef.current) onSelectRef.current(id as string | 'all')
      }
      reset()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      window.clearTimeout(accTimer)
    }
  }, [])

  const onScroll = () => {
    if (state.current.down) syncSelection()
    else scheduleSync()
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const el = ref.current
    if (!el) return
    // Native scroll + CSS snap handles momentum & settling.
    // Just track drag so a drag doesn't trigger a click.
    const s = state.current
    s.down = true
    s.startX = e.clientX
    s.scrollStart = el.scrollLeft
    s.moved = false

    const move = (ev: MouseEvent) => {
      if (!s.down) return
      const total = ev.clientX - s.startX
      if (Math.abs(total) > 5) s.moved = true
      el.scrollLeft = s.scrollStart - total
    }

    const up = () => {
      if (!s.down) return
      s.down = false
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      scheduleSync()
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
        className="wheel-mask no-scrollbar flex snap-x snap-mandatory cursor-grab select-none items-start gap-6 overflow-x-auto overscroll-x-contain py-4 [touch-action:pan-x] active:cursor-grabbing"
      >
        <div className="w-[45%] shrink-0" />
        {items.map((it) => {
          const active = selected === it.id
          return (
            <button
              key={it.id}
              data-id={it.id}
              onClick={() => {
                onSelect(it.id)
                centerId(it.id)
              }}
              className={`flex shrink-0 snap-center snap-always flex-col items-center gap-1 transition-transform duration-150 ${
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
