import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Download, MapPin, Pencil, Phone, Search, User } from 'lucide-react'
import { supabase } from '../supabase'
import type { Trip } from '../types'
import { fmtDate, fmtTime } from '../lib/time'
import { downloadCsv } from '../lib/csv'
import DateWheel from './DateWheel'
import TripEditor from './TripEditor'

export default function History() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [selected, setSelected] = useState<string | 'all' | null>(null)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<Trip | null>(null)

  const load = () => {
    supabase
      .from('trips')
      .select('*')
      .order('trip_date', { ascending: false })
      .order('trip_time', { ascending: false })
      .limit(2000)
      .then(({ data }) => {
        if (data) setTrips(data as Trip[])
      })
  }

  useEffect(() => {
    load()
  }, [])

  const dates = useMemo(
    () => [...new Set(trips.map((t) => t.trip_date))].sort((a, b) => b.localeCompare(a)),
    [trips]
  )

  const active = selected ?? dates[0] ?? 'all'

  const visible = useMemo(() => {
    let list = active === 'all' ? trips : trips.filter((t) => t.trip_date === active)
    const q = query.trim().toLowerCase()
    if (q)
      list = list.filter(
        (t) =>
          t.plate_number.toLowerCase().includes(q) ||
          (t.driver_name ?? '').toLowerCase().includes(q) ||
          (t.driver_phone ?? '').replace(/\s/g, '').includes(q.replace(/\s/g, ''))
      )
    return list
  }, [trips, active, query])

  const byDate = useMemo(() => {
    const m = new Map<string, Trip[]>()
    for (const t of visible) {
      const l = m.get(t.trip_date) ?? []
      l.push(t)
      m.set(t.trip_date, l)
    }
    return [...m.entries()]
  }, [visible])

  return (
    <div className="pt-8 md:pt-0">
      <div className="flex items-center justify-between px-6 md:px-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight">History</h1>
        <button
          onClick={() => downloadCsv(trips, 'quarrylog-all.csv')}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent"
        >
          <Download size={14} strokeWidth={1.5} /> CSV
        </button>
      </div>

      <div className="mt-4">
        <DateWheel dates={dates} selected={active} onSelect={setSelected} />
      </div>

      <div className="px-6 md:px-0">
        <div className="flex items-center gap-3 border-b border-line py-3">
          <Search size={16} strokeWidth={1.5} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search plate, name, phone"
            className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-[#3A3A3A]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-xs uppercase tracking-widest text-accent">
              Clear
            </button>
          )}
        </div>

        {byDate.map(([date, list]) => (
          <section key={date} className="pt-6">
            <h2 className="text-xs uppercase tracking-widest text-muted">
              {fmtDate(date)} · {list.length} loads
            </h2>
            <ul className="mt-2">
              {list.map((t) => (
                <li key={t.id} className="border-b border-line py-3">
                  <button
                    onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                    className="flex w-full items-center justify-between gap-3"
                  >
                    <span className="font-display text-lg tracking-tight">{t.plate_number}</span>
                    <span className="flex items-center gap-3 text-sm text-muted">
                      {t.driver_name && <span>{t.driver_name}</span>}
                      {fmtTime(t.trip_time)}
                      <ChevronRight
                        size={16}
                        strokeWidth={1.5}
                        className={`transition-transform ${expanded === t.id ? 'rotate-90 text-accent' : ''}`}
                      />
                    </span>
                  </button>
                  {expanded === t.id && (
                    <div className="mt-3 flex items-start justify-between gap-4 border border-line p-4">
                      <div className="min-w-0 space-y-1 text-xs text-muted">
                        {t.driver_name && (
                          <p className="flex items-center gap-1 text-sm text-white">
                            <User size={12} strokeWidth={1.5} /> {t.driver_name}
                          </p>
                        )}
                        {t.driver_phone && (
                          <a href={`tel:${t.driver_phone}`} className="flex items-center gap-1 hover:text-accent">
                            <Phone size={12} strokeWidth={1.5} /> {t.driver_phone}
                          </a>
                        )}
                        {t.location_name && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} strokeWidth={1.5} /> {t.location_name}
                          </span>
                        )}
                        {t.location_lat !== null && t.location_lng !== null && (
                          <a
                            href={`https://www.google.com/maps?q=${t.location_lat},${t.location_lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="underline hover:text-accent"
                          >
                            View map
                          </a>
                        )}
                        <button
                          onClick={() => setEditing(t)}
                          className="mt-2 flex items-center gap-1 border border-line px-2 py-1 uppercase tracking-widest hover:text-accent"
                        >
                          <Pencil size={12} strokeWidth={1.5} /> Edit
                        </button>
                      </div>
                      {t.image_url && (
                        <a href={t.image_url} target="_blank" rel="noreferrer">
                          <img src={t.image_url} alt="" className="h-24 w-24 shrink-0 object-cover" />
                        </a>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
        {byDate.length === 0 && <p className="py-8 text-sm text-muted">No trips found.</p>}
      </div>

      {editing && (
        <TripEditor
          trip={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
          onDelete={() => {
            setEditing(null)
            load()
          }}
        />
      )}
    </div>
  )
}
