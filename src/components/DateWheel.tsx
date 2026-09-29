import { useEffect, useRef } from 'react'

interface Props {
  dates: string[]
  selected: string
  onSelect: (d: string | 'all') => void
}

export default function DateWheel({ dates, selected, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current?.querySelector('[data-active="true"]')
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [selected, dates.length])

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
    <div ref={ref} className="no-scrollbar flex snap-x snap-mandatory gap-1 overflow-x-auto px-6 py-2">
      {items.map((it) => {
        const active = selected === it.id
        return (
          <button
            key={it.id}
            data-active={active}
            onClick={() => onSelect(it.id)}
            className="flex snap-center flex-col items-center gap-1 px-3"
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
