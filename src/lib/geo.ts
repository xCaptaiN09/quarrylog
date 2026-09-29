export const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    )
    if (!res.ok) return null
    const data = await res.json()
    const a = data.address ?? {}
    const road = [a.house_number, a.road].filter(Boolean).join(' ')
    const locality =
      a.suburb || a.village || a.town || a.subdistrict || a.city_district || a.city || a.municipality || ''
    const region = a.state_district || a.district || a.state || ''
    const parts = [road, locality, region].filter(Boolean)
    return parts.length ? parts.join(', ') : (data.display_name ?? null)
  } catch {
    return null
  }
}
