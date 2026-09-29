import { useEffect, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'

interface Props {
  dates: string[]
  selected: string
  onSelect: (d: string | 'all') => void
}

export default function DateWheel({ dates, selected, onSelect }: Props) {
  const onSelectRef = useRef(onSelect)
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

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'center', skipSnaps: false })

  useEffect(() => {
    if (!emblaApi) return
    const handle = () => {
      const id = items[emblaApi.selectedScrollSnap()]?.id
      if (id) onSelectRef.current(id)
    }
    emblaApi.on('select', handle)
    return () => {
      emblaApi.off('select', handle)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emblaApi, dates.length])

  useEffect(() => {
    if (!emblaApi) return
    const idx = items.findIndex((i) => i.id === selected)
    if (idx >= 0 && idx !== emblaApi.selectedScrollSnap()) emblaApi.scrollTo(idx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emblaApi, selected])

  useEffect(() => {
    if (!emblaApi) return
    const root = emblaApi.rootNode()
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.deltaY + e.deltaX > 0) emblaApi.scrollNext()
      else emblaApi.scrollPrev()
    }
    root.addEventListener('wheel', onWheel, { passive: false })
    return () => root.removeEventListener('wheel', onWheel)
  }, [emblaApi])

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-1/2 top-0 z-10 h-2 w-px -translate-x-1/2 bg-accent" />
      <div
        ref={emblaRef}
        className="overflow-hidden py-4"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
        }}
      >
        <div className="flex gap-6">
          {items.map((it) => {
            const active = selected === it.id
            return (
              <button
                key={it.id}
                onClick={() => {
                  onSelect(it.id)
                  emblaApi?.scrollTo(items.findIndex((x) => x.id === it.id))
                }}
                style={{ flex: '0 0 auto' }}
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
        </div>
      </div>
    </div>
  )
}
