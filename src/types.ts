export interface Trip {
  id: string
  plate_number: string
  trip_date: string
  trip_time: string
  created_at: string
  driver_name: string | null
  driver_phone: string | null
  location_lat: number | null
  location_lng: number | null
  location_name: string | null
  image_url: string | null
}
