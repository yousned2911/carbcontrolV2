import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import { getAuthorizedCompanyId } from '@/lib/auth'
import { uploadFile } from '@/lib/upload'

export async function GET(request: Request) {
  const auth = await getAuthorizedCompanyId()
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const vehicleId = searchParams.get('vehicleId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const supabase = await createClient()
  let query = supabase
    .from('fuel_logs')
    .select('*, vehicle:vehicles(plate, name), logger:users(full_name)')
    .eq('company_id', auth.companyId)
    .order('timestamp', { ascending: false })

  if (vehicleId) query = query.eq('vehicle_id', vehicleId)
  if (from) query = query.gte('timestamp', from)
  if (to) query = query.lte('timestamp', to)

  const { data: logs, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ logs })
}

export async function POST(request: Request) {
  const auth = await getAuthorizedCompanyId([
    'company_admin',
    'fleet_manager',
    'fuel_manager',
  ])
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const vehicleId = formData.get('vehicleId') as string
  const liters = parseFloat(formData.get('liters') as string)
  const cost = parseFloat(formData.get('cost') as string)
  const timestamp = (formData.get('timestamp') as string) || new Date().toISOString()
  const notes = (formData.get('notes') as string) || null
  const photo = formData.get('photo') as File | null

  if (!vehicleId || isNaN(liters)) {
    return NextResponse.json(
      { error: 'Vehicle and liters are required' },
      { status: 400 }
    )
  }

  let photoUrl: string | null = null
  if (photo && photo.size > 0) {
    try {
      photoUrl = await uploadFile('fuel-photos', auth.companyId, photo)
    } catch {
      return NextResponse.json(
        { error: 'Failed to upload photo' },
        { status: 500 }
      )
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fuel_logs')
    .insert({
      vehicle_id: vehicleId,
      company_id: auth.companyId,
      liters,
      cost: isNaN(cost) ? null : cost,
      timestamp,
      notes,
      photo_url: photoUrl,
      created_by: auth.userId,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ log: data })
}
