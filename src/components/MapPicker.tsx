import { useEffect, useRef, useState } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { X } from 'lucide-react'

const pinIcon = L.divIcon({
  className: '',
  html: `<svg width="28" height="40" viewBox="0 0 28 40" fill="none"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="#FF6B00"/><circle cx="14" cy="14" r="6" fill="#0A0A0A"/></svg>`,
  iconSize: [28, 40],
  iconAnchor: [14, 40],
})

interface Props {
  initial: { lat: number; lng: number } | null
  onSave: (lat: number, lng: number) => void
  onClose: () => void
}

export default function MapPicker({ initial, onSave, onClose }: Props) {
  const divRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(initial)

  useEffect(() => {
    if (!divRef.current) return
    const start = initial ?? { lat: 20.5937, lng: 78.9629 }
    const map = L.map(divRef.current).setView([start.lat, start.lng], initial ? 16 : 5)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    const place = (lat: number, lng: number) => {
      setPos({ lat, lng })
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        const m = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map)
        m.on('dragend', () => {
          const p = m.getLatLng()
          setPos({ lat: p.lat, lng: p.lng })
        })
        markerRef.current = m
      }
    }

    if (initial) place(initial.lat, initial.lng)
    map.on('click', (e: L.LeafletMouseEvent) => place(e.latlng.lat, e.latlng.lng))

    return () => {
      map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md border border-line bg-bg">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="text-xs uppercase tracking-widest text-muted">Tap the map to pin</span>
          <button onClick={onClose} className="text-muted hover:text-white">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div ref={divRef} className="h-80 w-full" />
        <button
          onClick={() => pos && onSave(pos.lat, pos.lng)}
          disabled={!pos}
          className="w-full bg-white py-3 font-display text-sm font-semibold uppercase tracking-widest text-black disabled:opacity-40"
        >
          Save pin
        </button>
      </div>
    </div>
  )
}
