import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import { getAuthorizedCompanyId } from '@/lib/auth'

export async function GET() {
  const auth = await getAuthorizedCompanyId()
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('*, depot:depots(name)')
    .eq('company_id', auth.companyId)
    .order('plate', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ vehicles })
}

export async function POST(request: Request) {
  const auth = await getAuthorizedCompanyId(['company_admin', 'fleet_manager'])
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, plate, vin, tracker_id, fuel_sensor_id, depot_id } = await request.json()

  if (!name || !plate) {
    return NextResponse.json({ error: 'Name and plate are required' }, { status: 400 })
  }

  const supabase = await createClient()

  if (depot_id) {
    const { data: depot } = await supabase
      .from('depots')
      .select('id')
      .eq('id', depot_id)
      .eq('company_id', auth.companyId)
      .single()

    if (!depot) {
      return NextResponse.json({ error: 'Depot not found or does not belong to this company' }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      company_id: auth.companyId,
      name,
      plate,
      vin: vin || null,
      tracker_id: tracker_id || null,
      fuel_sensor_id: fuel_sensor_id || null,
      depot_id: depot_id || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ vehicle: data })
}
