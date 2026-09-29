import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Download, MapPin, Phone } from 'lucide-react'
import { supabase } from '../supabase'
import type { Trip } from '../types'
import { fmtDate, fmtTime } from '../lib/time'
import { downloadCsv } from '../lib/csv'

export default function History() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('trips')
      .select('*')
      .order('trip_date', { ascending: false })
      .order('trip_time', { ascending: false })
      .limit(2000)
      .then(({ data }) => { if (data) setTrips(data as Trip[]) })
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
        <button onClick={() => downloadCsv(trips, 'quarrylog-all.csv')} className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent">
          <Download size={14} strokeWidth={1.5} /> CSV
        </button>
      </div>
      <div className="mt-6 md:columns-2 md:gap-12 xl:columns-3">
        {byDate.map(([date, list]) => {
          const counts = new Map<string, Trip[]>()
          for (const t of list) counts.set(t.plate_number, [...(counts.get(t.plate_number) ?? []), t])
          const isOpen = open === date
          return (
            <section key={date} className="break-inside-avoid border-b border-line py-4">
              <button onClick={() => setOpen(isOpen ? null : date)} className="flex w-full items-center justify-between">
                <span className="font-display text-lg tracking-tight">{fmtDate(date)}</span>
                <span className="flex items-center gap-2 text-sm text-muted">
                  {list.length} loads
                  {isOpen ? <ChevronDown size={16} strokeWidth={1.5} /> : <ChevronRight size={16} strokeWidth={1.5} />}
                </span>
              </button>
              {isOpen && (
                <ul className="mt-3">
                  {[...counts.entries()].map(([plate, rows]) => (
                    <li key={plate} className="border-t border-line/60 py-3">
                      <div className="flex items-center justify-between">
                        <span className="font-display tracking-tight">{plate}</span>
                        <span className="text-sm text-accent">{rows.length} loads</span>
                      </div>
                      <p className="mt-1 text-xs text-muted">{rows.map((r) => fmtTime(r.trip_time)).join(' · ')}</p>
                      <div className="mt-2 space-y-1">
                        {rows.map((r) => (
                          <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                            {r.driver_phone && (
                              <a href={`tel:${r.driver_phone}`} className="flex items-center gap-1 hover:text-accent">
                                <Phone size={12} /> {r.driver_phone}
                              </a>
                            )}
                            {r.location_lat && r.location_lng && (
                              <a href={`https://www.google.com/maps?q=${r.location_lat},${r.location_lng}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-accent">
                                <MapPin size={12} /> {r.location_name || 'View Map'}
                              </a>
                            )}
                            {r.image_url && (
                              <a href={r.image_url} target="_blank" rel="noreferrer" className="underline hover:text-accent">Photo</a>
                            )}
                          </div>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
        {byDate.length === 0 && <p className="py-8 text-sm text-muted">No trips recorded yet.</p>}
      </div>
    </div>
  )
}
