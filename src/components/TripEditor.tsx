import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Camera, Image as ImageIcon, Map as MapIcon, MapPin, X } from 'lucide-react'
import { supabase } from '../supabase'
import type { Trip } from '../types'
import { fmtTime, localDateStr, localTimeStr } from '../lib/time'
import { reverseGeocode } from '../lib/geo'
import MapPicker from './MapPicker'

interface Props {
  trip: Trip
  onClose: () => void
  onSaved: () => void
}

export default function TripEditor({ trip, onClose, onSaved }: Props) {
  const [plate, setPlate] = useState(trip.plate_number)
  const [phone, setPhone] = useState(trip.driver_phone ?? '')
  const [dt, setDt] = useState(`${trip.trip_date}T${fmtTime(trip.trip_time)}`)
  const [locName, setLocName] = useState(trip.location_name ?? '')
  const [lat, setLat] = useState<number | null>(trip.location_lat)
  const [lng, setLng] = useState<number | null>(trip.location_lng)
  const [imageUrl, setImageUrl] = useState<string | null>(trip.image_url)
  const [newFile, setNewFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState('')

  const gps = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        setLat(p.coords.latitude)
        setLng(p.coords.longitude)
        const name = await reverseGeocode(p.coords.latitude, p.coords.longitude)
        if (name) setLocName(name)
        setLocating(false)
      },
      () => {
        setFlash('Location permission denied.')
        setLocating(false)
      }
    )
  }

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setNewFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  const save = async () => {
    const value = plate.trim().toUpperCase()
    if (!value || saving) return
    setSaving(true)
    let url = imageUrl
    if (newFile) {
      const path = `${Date.now()}-${newFile.name.replaceAll(' ', '_')}`
      const { error: upErr } = await supabase.storage.from('lorry-images').upload(path, newFile)
      if (!upErr) url = supabase.storage.from('lorry-images').getPublicUrl(path).data.publicUrl
    }
    const when = new Date(dt)
    const { error } = await supabase
      .from('trips')
      .update({
        plate_number: value,
        driver_phone: phone.trim() || null,
        trip_date: localDateStr(when),
        trip_time: localTimeStr(when),
        location_name: locName.trim() || null,
        location_lat: lat,
        location_lng: lng,
        image_url: url,
      })
      .eq('id', trip.id)
    setSaving(false)
    if (error) {
      setFlash('Failed to save changes.')
      return
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/80 md:items-center">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto border border-line bg-bg p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">Edit load</h2>
          <button onClick={onClose} className="text-muted hover:text-white">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <label className="mt-6 block text-xs uppercase tracking-widest text-muted">Plate number</label>
        <input
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          className="w-full border-b border-line bg-transparent py-3 font-display text-2xl tracking-tight text-white outline-none focus:border-accent"
        />

        <label className="mt-5 block text-xs uppercase tracking-widest text-muted">Driver phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border-b border-line bg-transparent py-3 text-base text-white outline-none focus:border-accent"
        />

        <label className="mt-5 block text-xs uppercase tracking-widest text-muted">Date and time</label>
        <input
          type="datetime-local"
          value={dt}
          onChange={(e) => setDt(e.target.value)}
          className="w-full border-b border-line bg-transparent py-3 text-base text-white outline-none [color-scheme:dark] focus:border-accent"
        />

        <label className="mt-5 block text-xs uppercase tracking-widest text-muted">Location</label>
        <input
          value={locName}
          onChange={(e) => setLocName(e.target.value)}
          placeholder="Address or site name"
          className="w-full border-b border-line bg-transparent py-3 text-base text-white outline-none placeholder:text-[#3A3A3A] focus:border-accent"
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={gps}
            disabled={locating}
            className="flex items-center gap-2 border border-line px-3 py-2 text-xs uppercase tracking-widest text-muted"
          >
            <MapPin size={14} strokeWidth={1.5} /> {locating ? '...' : 'GPS'}
          </button>
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="flex items-center gap-2 border border-line px-3 py-2 text-xs uppercase tracking-widest text-muted"
          >
            <MapIcon size={14} strokeWidth={1.5} /> Pin on map
          </button>
        </div>
        {lat && lng && <p className="mt-2 text-xs text-muted">Coords: {lat.toFixed(5)}, {lng.toFixed(5)}</p>}

        <label className="mt-5 block text-xs uppercase tracking-widest text-muted">Photo</label>
        <div className="mt-2 flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 border border-line px-3 py-2 text-xs uppercase tracking-widest text-muted">
            <Camera size={14} strokeWidth={1.5} /> Camera
            <input type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" />
          </label>
          <label className="flex cursor-pointer items-center gap-2 border border-line px-3 py-2 text-xs uppercase tracking-widest text-muted">
            <ImageIcon size={14} strokeWidth={1.5} /> Upload
            <input type="file" accept="image/*" onChange={pick} className="hidden" />
          </label>
          {(preview || imageUrl) && (
            <img src={preview ?? imageUrl ?? ''} alt="" className="h-12 w-12 object-cover" />
          )}
          {imageUrl && (
            <button
              type="button"
              onClick={() => { setImageUrl(null); setNewFile(null); setPreview(null) }}
              className="text-xs uppercase tracking-widest text-accent"
            >
              Remove
            </button>
          )}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-8 w-full bg-white py-4 font-display text-sm font-semibold uppercase tracking-widest text-black active:bg-accent disabled:opacity-50"
        >
          {saving ? 'Saving' : 'Save changes'}
        </button>
        {flash && <p className="mt-3 text-sm text-accent">{flash}</p>}
      </div>
      {mapOpen && (
        <MapPicker
          initial={lat !== null && lng !== null ? { lat, lng } : null}
          onSave={(a, b) => {
            setLat(a)
            setLng(b)
            setMapOpen(false)
            reverseGeocode(a, b).then((n) => n && setLocName(n))
          }}
          onClose={() => setMapOpen(false)}
        />
      )}
    </div>
  )
}
