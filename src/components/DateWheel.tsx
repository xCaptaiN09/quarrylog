import { useEffect, useRef, useState } from 'react'

interface Props {
  dates: string[]
  selected: string
  onSelect: (d: string | 'all') => void
}

export default function DateWheel({ dates, selected, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const api = useRef<{ center: (id: string, smooth: boolean) => void } | null>(null)
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

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setHalf(el.clientWidth / 2)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    if (half > 0 && api.current) {
      api.current.center(selectedRef.current, false)
      const t = window.setTimeout(() => api.current?.center(selectedRef.current, false), 250)
      return () => window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [half, dates.length])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let down = false
    let pointerId = -1
    let startX = 0
    let scrollStart = 0
    let lastX = 0
    let lastT = 0
    let moved = 0
    let vel = 0
    let momentumRaf: number | null = null
    let settleTimer: number | undefined
    let pickRaf: number | null = null
    let downTarget: Element | null = null

    const center = (id: string, smooth: boolean) => {
      const t = el.querySelector<HTMLElement>(`[data-id="${id}"]`)
      if (!t) return
      el.scrollTo({
        left: t.offsetLeft + t.clientWidth / 2 - el.clientWidth / 2,
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
    api.current = { center }

    const pick = (settle: boolean) => {
      const c = el.scrollLeft + el.clientWidth / 2
      let best: string | null = null
      let bestD = Infinity
      el.querySelectorAll<HTMLElement>('[data-id]').forEach((n) => {
        const d = Math.abs(n.offsetLeft + n.clientWidth / 2 - c)
        if (d < bestD) {
          bestD = d
          best = n.dataset.id ?? null
        }
      })
      if (!best) return
      if (best !== selectedRef.current) onSelectRef.current(best)
      if (settle && bestD > 4) center(best, true)
    }

    const stopMomentum = () => {
      if (momentumRaf) cancelAnimationFrame(momentumRaf)
      momentumRaf = null
    }

    const onScroll = () => {
      if (pickRaf) cancelAnimationFrame(pickRaf)
      pickRaf = requestAnimationFrame(() => pick(false))
      if (down) return
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(() => {
        if (!momentumRaf) pick(true)
      }, 160)
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      stopMomentum()
      el.scrollLeft += (e.deltaY + e.deltaX) * 2
    }

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      down = true
      pointerId = e.pointerId
      startX = e.clientX
      lastX = e.clientX
      lastT = performance.now()
      scrollStart = el.scrollLeft
      moved = 0
      vel = 0
      downTarget = e.target as Element
      stopMomentum()
      window.clearTimeout(settleTimer)
      el.scrollTo({ left: el.scrollLeft, behavior: 'auto' })
      el.setPointerCapture(pointerId)
    }

    const onMove = (e: PointerEvent) => {
      if (!down) return
      const total = e.clientX - startX
      if (Math.abs(total) > 5) moved = Math.abs(total)
      el.scrollLeft = scrollStart - total
      const now = performance.now()
      const dt = now - lastT
      if (dt > 0) vel = Math.max(-3, Math.min(3, (lastX - e.clientX) / dt))
      lastX = e.clientX
      lastT = now
    }

    const onUp = (e: PointerEvent) => {
      if (!down) return
      down = false
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
      if (moved < 5 && downTarget) {
        const btn = downTarget.closest('[data-id]')
        if (btn) (btn as HTMLElement).click()
      } else if (Math.abs(vel) > 0.15) {
        let last = performance.now()
        const step = (now: number) => {
          const dt = Math.min(now - last, 64)
          last = now
          vel *= Math.pow(0.96, dt / 16.7)
          const before = el.scrollLeft
          el.scrollLeft += vel * dt
          if (Math.abs(vel) > 0.02 && el.scrollLeft !== before) {
            momentumRaf = requestAnimationFrame(step)
          } else {
            momentumRaf = null
          }
        }
        momentumRaf = requestAnimationFrame(step)
      }
    }

    el.addEventListener('scroll', onScroll)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)

    return () => {
      stopMomentum()
      window.clearTimeout(settleTimer)
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [])

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-1/2 top-0 z-10 h-2 w-px -translate-x-1/2 bg-accent" />
      <div
        ref={ref}
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
                api.current?.center(it.id, true)
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
