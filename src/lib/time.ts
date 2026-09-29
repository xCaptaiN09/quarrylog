export const pad = (n: number) => String(n).padStart(2, '0')

export const localDateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const localTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

export const fmtTime = (t: string) => t.slice(0, 5)

export const fmtDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}
