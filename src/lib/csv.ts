import type { Trip } from '../types'

export const downloadCsv = (trips: Trip[], filename: string) => {
  const rows = [
    ['date', 'time', 'plate_number', 'driver_phone', 'location_name', 'lat', 'lng', 'image_url'],
    ...trips.map((t) => [
      t.trip_date,
      t.trip_time,
      t.plate_number,
      t.driver_phone ?? '',
      t.location_name ?? '',
      t.location_lat?.toString() ?? '',
      t.location_lng?.toString() ?? '',
      t.image_url ?? '',
    ]),
  ]
  const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
