import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Download, MapPin, Pencil, Phone } from 'lucide-react'
import { supabase } from '../supabase'
import type { Trip } from '../types'
import { fmtDate, fmtTime } from '../lib/time'
import { downloadCsv } from '../lib/csv'
import TripEditor from './TripEditor'

export default function History() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [open, setOpen] = useState<string | null>(null)
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

  const byDate = useMemo(() => {
    const m = new Map<string, Trip[]>()
    for (const t of trips) {
      const list = m.get(t.trip_date) ?? []
      list.push(t)
      m.set(t.trip_date, list)
    }
    return [...m.entries()]
  }, [trips])

  return (
    <div className="px-6 pt-8 md:px-0 md:pt-0">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-tight">History</h1>
        <button
          onClick={() => downloadCsv(trips, 'quarrylog-all.csv')}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent"
        >
          <Download size={14} strokeWidth={1.5} /> CSV
        </button>
      </div>
      <div className="mt-6">
        {byDate.map(([date, list]) => {
          const counts = new Map<string, number>()
          for (const t of list) counts.set(t.plate_number, (counts.get(t.plate_number) ?? 0) + 1)
          const isOpen = open === date
          return (
            <section key={date} className="border-b border-line py-4">
              <button
                onClick={() => setOpen(isOpen ? null : date)}
                className="flex w-full items-center justify-between"
              >
                <span className="font-display text-lg tracking-tight">{fmtDate(date)}</span>
                <span className="flex items-center gap-2 text-sm text-muted">
                  {list.length} loads
                  {isOpen ? (
                    <ChevronDown size={16} strokeWidth={1.5} />
                  ) : (
                    <ChevronRight size={16} strokeWidth={1.5} />
                  )}
                </span>
              </button>
              {isOpen && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {[...counts.entries()].map(([p, c]) => (
                      <span key={p} className="border border-line px-2 py-1 text-xs text-muted">
                        {p} × {c}
                      </span>
                    ))}
                  </div>
                  <ul className="mt-4 space-y-3">
                    {list.map((t) => (
                      <li key={t.id} className="border border-line p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <span className="font-display text-xl tracking-tight">{t.plate_number}</span>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                              <span>{fmtTime(t.trip_time)}</span>
                              {t.driver_phone && (
                                <a
                                  href={`tel:${t.driver_phone}`}
                                  className="flex items-center gap-1 hover:text-accent"
                                >
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
                              {!t.driver_phone && !t.location_name && t.location_lat === null && (
                                <span>No extra details</span>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            {t.image_url && (
                              <a href={t.image_url} target="_blank" rel="noreferrer">
                                <img src={t.image_url} alt="" className="h-20 w-20 object-cover" />
                              </a>
                            )}
                            <button onClick={() => setEditing(t)} className="text-muted hover:text-accent">
                              <Pencil size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )
        })}
        {byDate.length === 0 && <p className="py-8 text-sm text-muted">No trips recorded yet.</p>}
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
