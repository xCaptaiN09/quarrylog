import { useEffect, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'

interface Props {
  dates: string[]
  selected: string
  onSelect: (d: string | 'all') => void
}

export default function DateWheel({ dates, selected, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef({ down: false, startX: 0, startScroll: 0, moved: false })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      el.scrollLeft += (e.deltaY + e.deltaX) * 2
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const target = el.querySelector<HTMLElement>(`[data-id="${selected}"]`)
    if (!target) return
    el.scrollTo({
      left: target.offsetLeft - el.clientWidth / 2 + target.clientWidth / 2,
      behavior: 'auto',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates.length])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !ref.current) return
    drag.current = { down: true, startX: e.clientX, startScroll: ref.current.scrollLeft, moved: false }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.down || !ref.current) return
    const dx = e.clientX - drag.current.startX
    if (Math.abs(dx) > 5) drag.current.moved = true
    ref.current.scrollLeft = drag.current.startScroll - dx
  }

  const endDrag = () => {
    drag.current.down = false
  }

  const onClickCapture = (e: ReactMouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault()
      e.stopPropagation()
      drag.current.moved = false
    }
  }

  const pick = (id: string) => {
    onSelect(id)
    const el = ref.current
    if (!el) return
    const target = el.querySelector<HTMLElement>(`[data-id="${id}"]`)
    if (!target) return
    el.scrollTo({
      left: target.offsetLeft - el.clientWidth / 2 + target.clientWidth / 2,
      behavior: 'smooth',
    })
  }

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

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
      className="no-scrollbar flex cursor-grab select-none gap-3 overflow-x-auto overscroll-x-contain px-6 py-2 active:cursor-grabbing"
    >
      {items.map((it) => {
        const active = selected === it.id
        return (
          <button
            key={it.id}
            data-id={it.id}
            onClick={() => pick(it.id)}
            className="flex flex-col items-center gap-1 px-2"
          >
            <span className={`w-px transition-all ${active ? 'h-8 bg-accent' : 'h-4 bg-line'}`} />
            <span className={`font-display text-xl tracking-tight ${active ? 'text-white' : 'text-muted'}`}>
              {it.label}
            </span>
            <span className={`text-[10px] uppercase tracking-widest ${active ? 'text-accent' : 'text-muted'}`}>
              {it.sub}
            </span>
          </button>
        )
      })}
    </div>
  )
}
