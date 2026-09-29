export const pad = (n: number) => String(n).padStart(2, '0')

export const localDateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const localTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

export const fmtTime = (t: string) => t.slice(0, 5)

export const fmtDate = (dateStr: string) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
