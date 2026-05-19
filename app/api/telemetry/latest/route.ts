import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { getAuthorizedCompanyId } from '@/lib/auth'

export async function GET() {
  const auth = await getAuthorizedCompanyId()
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, name, plate')
    .eq('company_id', auth.companyId)

  if (!vehicles || vehicles.length === 0) {
    return NextResponse.json({ data: [] })
  }

  const vehicleIds = vehicles.map((v) => v.id)
  const vehicleMap = new Map(vehicles.map((v) => [v.id, { name: v.name, plate: v.plate }]))

  const { data: telemetry } = await supabase
    .from('telemetry')
    .select('vehicle_id, lat, lng, speed, fuel_level, ignition, timestamp')
    .in('vehicle_id', vehicleIds)
    .order('timestamp', { ascending: false })

  if (!telemetry) {
    return NextResponse.json({ data: [] })
  }

  const latestMap = new Map<string, typeof telemetry[0]>()
  for (const row of telemetry) {
    if (!latestMap.has(row.vehicle_id)) {
      latestMap.set(row.vehicle_id, row)
    }
  }

  const data = Array.from(latestMap.entries()).map(([vehicleId, row]) => {
    const info = vehicleMap.get(vehicleId)
    return {
      vehicle_id: vehicleId,
      lat: row.lat,
      lng: row.lng,
      speed: row.speed,
      fuel_level: row.fuel_level,
      ignition: row.ignition,
      timestamp: row.timestamp,
      vehicle_name: info?.name ?? null,
      vehicle_plate: info?.plate ?? null,
    }
  })

  return NextResponse.json({ data })
}
