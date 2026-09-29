import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowUpRight, Award, Clock, Plus, Truck, X } from 'lucide-react'
import { supabase } from '../supabase'
import type { Trip } from '../types'
import { fmtDate, fmtTime, localDateStr, localTimeStr } from '../lib/time'

export default function Today() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [plate, setPlate] = useState('')
  const [manual, setManual] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const today = localDateStr(new Date())
  const now = new Date()

  const load = async () => {
    const { data } = await supabase
      .from('trips')
      .select('*')
      .eq('trip_date', today)
      .order('trip_time', { ascending: false })
    if (data) setTrips(data as Trip[])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today])

  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of trips) m.set(t.plate_number, (m.get(t.plate_number) ?? 0) + 1)
    return m
  }, [trips])

  const top = useMemo(() => {
    let best: [string, number] | null = null
    for (const [p, c] of counts) if (!best || c > best[1]) best = [p, c]
    return best
  }, [counts])

  const add = async (e: FormEvent) => {
    e.preventDefault()
    const value = plate.trim().toUpperCase()
    if (!value || saving) return
    setSaving(true)
    const when = manual ? new Date(manual) : new Date()
    const { error } = await supabase.from('trips').insert({
      plate_number: value,
      trip_date: localDateStr(when),
      trip_time: localTimeStr(when),
    })
    if (!error) {
      setFlash(`Load ${(counts.get(value) ?? 0) + 1} for ${value}`)
      setPlate('')
      setManual(null)
      await load()
    } else {
      setFlash('Failed to save load.')
    }
    setSaving(false)
    setTimeout(() => setFlash(''), 2500)
  }

  const remove = async (id: string) => {
    await supabase.from('trips').delete().eq('id', id)
    await load()
  }

  return (
    <div className="px-6 md:grid md:grid-cols-2 md:gap-x-12 md:px-0">
      <header className="flex items-baseline justify-between pt-8 md:col-span-2 md:pt-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Today</h1>
        <span className="text-xs uppercase tracking-widest text-muted">{fmtDate(today)}</span>
      </header>

      <section className="relative pt-6 md:col-span-2">
        <span className="pointer-events-none absolute right-4 top-0 select-none font-display text-[110px] font-bold leading-none text-[#1C1C1C] md:text-[160px]">
          {trips.length}
        </span>
        <p className="font-display text-5xl font-semibold tracking-tighter md:text-7xl">
          {trips.length}
        </p>
        <p className="mt-1 text-sm text-muted">loads today</p>
        <div className="mt-4 flex h-8 w-40 md:w-64">
          <div
            className="h-full bg-accent"
            style={{ width: `${top && trips.length ? (top[1] / trips.length) * 100 : 0}%` }}
          />
          <div className="h-full flex-1 bg-[#3A3A3A]" />
        </div>
        <p className="mt-3 text-sm text-muted">
          {counts.size} lorries · last {trips[0] ? fmtTime(trips[0].trip_time) : '--:--'}
        </p>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-0.5 md:col-span-2 md:grid-cols-4">
        <div className="flex aspect-square flex-col justify-between bg-accent p-4 text-black">
          <span className="text-sm">Lorries</span>
          <div>
            <p className="font-display text-4xl font-semibold tracking-tighter">{counts.size}</p>
            <Truck className="mt-3" size={22} strokeWidth={1.5} />
          </div>
        </div>
        <div className="flex aspect-square flex-col justify-between bg-tile p-4">
          <span className="text-sm text-muted">Top lorry</span>
          <div>
            <p className="truncate font-display text-2xl font-semibold tracking-tight">
              {top ? top[0] : '—'}
            </p>
            <Award className="mt-3 text-white" size={22} strokeWidth={1.5} />
          </div>
        </div>
        <div className="flex aspect-square flex-col justify-between bg-tile p-4">
          <span className="text-sm text-muted">Last load</span>
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight">
              {trips[0] ? fmtTime(trips[0].trip_time) : '--:--'}
            </p>
            <p className="text-xs text-muted">{trips[0]?.plate_number ?? ''}</p>
            <Clock className="mt-2 text-white" size={22} strokeWidth={1.5} />
          </div>
        </div>
        <button
          onClick={() => inputRef.current?.focus()}
          className="flex aspect-square flex-col justify-between bg-accent p-4 text-left text-black"
        >
          <span className="text-sm">Quick add</span>
          <Plus size={22} strokeWidth={1.5} />
        </button>
      </section>

      <form onSubmit={add} className="pt-10 md:col-start-1">
        <label className="text-xs uppercase tracking-widest text-muted" htmlFor="plate">
          Plate number
        </label>
        <input
          id="plate"
          ref={inputRef}
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          placeholder="KL 00 A 0000"
          className="w-full border-b border-line bg-transparent py-4 font-display text-3xl tracking-tight text-white outline-none placeholder:text-[#3A3A3A] focus:border-accent"
        />
        <div className="flex items-center justify-between border-b border-line py-4">
          <span className="text-sm text-muted">Time</span>
          {manual ? (
            <div className="flex items-center gap-3">
              <input
                type="datetime-local"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                className="bg-transparent text-sm text-white outline-none [color-scheme:dark]"
              />
              <button
                type="button"
                onClick={() => setManual(null)}
                className="text-xs uppercase tracking-widest text-accent"
              >
                Auto
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setManual(`${today}T${localTimeStr(now)}`)}
              className="flex items-center gap-2 text-sm text-white"
            >
              Auto · {localTimeStr(now)}
              <Clock size={14} strokeWidth={1.5} className="text-muted" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-8 flex w-full items-center justify-between bg-white px-5 py-4 font-display text-sm font-semibold uppercase tracking-widest text-black active:bg-accent disabled:opacity-50"
        >
          {saving ? 'Saving' : 'Add load'}
          <ArrowUpRight size={16} strokeWidth={1.5} />
        </button>
        {flash && <p className="mt-3 text-sm text-accent">{flash}</p>}
      </form>

      <section className="pb-4 pt-10 md:col-start-2 md:pt-10">
        <h2 className="text-xs uppercase tracking-widest text-muted">Recent</h2>
        <ul className="mt-2">
          {trips.slice(0, 8).map((t) => (
            <li key={t.id} className="flex items-center justify-between border-b border-line py-3">
              <span className="font-display text-lg tracking-tight">{t.plate_number}</span>
              <span className="flex items-center gap-4 text-sm text-muted">
                {fmtTime(t.trip_time)}
                <button onClick={() => remove(t.id)} className="hover:text-accent">
                  <X size={16} strokeWidth={1.5} />
                </button>
              </span>
            </li>
          ))}
          {trips.length === 0 && <li className="py-6 text-sm text-muted">No loads yet today.</li>}
        </ul>
      </section>
    </div>
  )
}
