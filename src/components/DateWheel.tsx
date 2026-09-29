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
  const scrollTimer = useRef<number | undefined>(undefined)
  const selectedRef = useRef(selected)
  selectedRef.current = selected

  const centerOn = (id: string, smooth: boolean) => {
    const el = ref.current
    if (!el) return
    const target = el.querySelector<HTMLElement>(`[data-id="${id}"]`)
    if (!target) return
    const left = target.offsetLeft - el.clientWidth / 2 + target.clientWidth / 2
    el.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' })
  }

  useEffect(() => {
    centerOn(selected, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates.length])

  useEffect(() => {
    centerOn(selected, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      el.scrollLeft += e.deltaY + e.deltaX
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const pickCenter = () => {
    const el = ref.current
    if (!el) return
    const center = el.scrollLeft + el.clientWidth / 2
    let bestId: string | null = null
    let bestDist = Infinity
    el.querySelectorAll<HTMLElement>('[data-id]').forEach((child) => {
      const c = child.offsetLeft + child.clientWidth / 2
      const d = Math.abs(c - center)
      if (d < bestDist) {
        bestDist = d
        bestId = child.dataset.id ?? null
      }
    })
    if (bestId && bestId !== selectedRef.current) onSelect(bestId)
  }

  const onScroll = () => {
    window.clearTimeout(scrollTimer.current)
    scrollTimer.current = window.setTimeout(pickCenter, 150)
  }

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
    <div className="flex justify-center">
      <div
        ref={ref}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
        className="no-scrollbar w-full max-w-lg cursor-grab select-none overflow-x-auto px-[45%] py-2 active:cursor-grabbing"
      >
        <div className="flex w-max gap-4">
          {items.map((it) => {
            const active = selected === it.id
            return (
              <button
                key={it.id}
                data-id={it.id}
                onClick={() => onSelect(it.id)}
                className="flex flex-col items-center gap-1 px-2"
              >
                <span className={`w-px transition-all ${active ? 'h-8 bg-accent' : 'h-4 bg-line'}`} />
                <span
                  className={`font-display text-xl tracking-tight ${active ? 'text-white' : 'text-muted'}`}
                >
                  {it.label}
                </span>
                <span
                  className={`text-[10px] uppercase tracking-widest ${active ? 'text-accent' : 'text-muted'}`}
                >
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
