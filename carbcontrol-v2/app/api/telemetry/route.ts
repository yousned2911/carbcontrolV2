import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import { getAuthorizedCompanyId } from '@/lib/auth'

export async function GET(request: Request) {
  const auth = await getAuthorizedCompanyId()
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const vehicleId = searchParams.get('vehicleId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!vehicleId) {
    return NextResponse.json({ error: 'vehicleId is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, company_id')
    .eq('id', vehicleId)
    .eq('company_id', auth.companyId)
    .single()

  if (!vehicle) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
  }

  let query = supabase
    .from('telemetry')
    .select('id, vehicle_id, lat, lng, speed, fuel_level, ignition, timestamp, raw_data')
    .eq('vehicle_id', vehicleId)
    .order('timestamp', { ascending: true })

  if (from) query = query.gte('timestamp', from)
  if (to) query = query.lte('timestamp', to)

  const { data: telemetry, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: telemetry })
}
