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
    const el = ref.current?.querySelector('[data-active="true"]')
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [selected, dates.length])

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'mouse' || !ref.current) return
    drag.current = { down: true, startX: e.clientX, startScroll: ref.current.scrollLeft, moved: false }
  }

  const onPointerMove = (e: ReactPointerEvent) => {
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
      onPointerLeave={endDrag}
      onClickCapture={onClickCapture}
      className="no-scrollbar flex cursor-grab select-none gap-1 overflow-x-auto px-6 py-2 active:cursor-grabbing"
    >
      {items.map((it) => {
        const active = selected === it.id
        return (
          <button
            key={it.id}
            data-active={active}
            onClick={() => onSelect(it.id)}
            className="flex flex-col items-center gap-1 px-3"
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
