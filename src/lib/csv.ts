import type { Trip } from '../types'

export const downloadCsv = (trips: Trip[], filename: string) => {
  const rows = [
    ['date', 'time', 'plate_number'],
    ...trips.map((t) => [t.trip_date, t.trip_time, t.plate_number]),
  ]
  const csv = rows.map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
