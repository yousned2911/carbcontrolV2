import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import { getAuthorizedCompanyId } from '@/lib/auth'

type Props = {
  params: { id: string }
}

export async function GET(request: Request, { params }: Props) {
  const auth = await getAuthorizedCompanyId()
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select('*, depot:depots(name)')
    .eq('id', params.id)
    .eq('company_id', auth.companyId)
    .single()

  if (error || !vehicle) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
  }

  return NextResponse.json({ vehicle })
}

export async function PATCH(request: Request, { params }: Props) {
  const auth = await getAuthorizedCompanyId(['company_admin', 'fleet_manager'])
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, plate, vin, tracker_id, fuel_sensor_id, depot_id } = body

  const supabase = await createClient()

  if (depot_id !== undefined && depot_id !== null) {
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

  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (plate !== undefined) updateData.plate = plate
  if (vin !== undefined) updateData.vin = vin || null
  if (tracker_id !== undefined) updateData.tracker_id = tracker_id || null
  if (fuel_sensor_id !== undefined) updateData.fuel_sensor_id = fuel_sensor_id || null
  if (depot_id !== undefined) updateData.depot_id = depot_id || null

  const { data, error } = await supabase
    .from('vehicles')
    .update(updateData)
    .eq('id', params.id)
    .eq('company_id', auth.companyId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
  }

  return NextResponse.json({ vehicle: data })
}

export async function DELETE(request: Request, { params }: Props) {
  const auth = await getAuthorizedCompanyId(['company_admin', 'fleet_manager'])
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', params.id)
    .eq('company_id', auth.companyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
