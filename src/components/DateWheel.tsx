import { useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'

interface Props {
  dates: string[]
  selected: string
  onSelect: (d: string | 'all') => void
}

export default function DateWheel({ dates, selected, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef({
    down: false,
    pointerId: -1,
    startX: 0,
    lastX: 0,
    moved: false,
    captured: false,
  })
  const raf = useRef<number | null>(null)
  const settleTimer = useRef<number | undefined>(undefined)
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

  const stopAnimations = () => {
    window.clearTimeout(settleTimer.current)
    if (raf.current) cancelAnimationFrame(raf.current)
    ref.current?.style.setProperty('scroll-behavior', 'auto')
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
    if (best !== selected) onSelect(best)
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
    if (half > 0) centerItem(selected, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [half, dates.length])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      window.clearTimeout(settleTimer.current)
      el.scrollLeft += (e.deltaY + e.deltaX) * 2
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const onScroll = () => {
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => pickCenter(false))
    window.clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => pickCenter(true), 160)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !ref.current) return
    stopAnimations()
    drag.current = {
      down: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      lastX: e.clientX,
      moved: false,
      captured: false,
    }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.down || !ref.current) return
    if (!drag.current.captured && Math.abs(e.clientX - drag.current.startX) > 5) {
      drag.current.captured = true
      drag.current.moved = true
      ref.current.setPointerCapture(drag.current.pointerId)
    }
    if (drag.current.captured) {
      ref.current.scrollLeft += drag.current.lastX - e.clientX
    }
    drag.current.lastX = e.clientX
  }

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current.captured && ref.current?.hasPointerCapture(e.pointerId)) {
      ref.current.releasePointerCapture(e.pointerId)
    }
    drag.current.down = false
    drag.current.captured = false
  }

  const onClickCapture = (e: ReactMouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault()
      e.stopPropagation()
      drag.current.moved = false
    }
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-1/2 top-0 z-10 h-2 w-px -translate-x-1/2 bg-accent" />
      <div
        ref={ref}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
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
