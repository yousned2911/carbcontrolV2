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
    .from('maintenance_logs')
    .select('*, vehicle:vehicles(plate, name)')
    .eq('company_id', auth.companyId)
    .order('date', { ascending: false })

  if (vehicleId) query = query.eq('vehicle_id', vehicleId)
  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

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
    'maintenance_manager',
  ])
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const vehicleId = formData.get('vehicleId') as string
  const type = (formData.get('type') as string) || null
  const description = (formData.get('description') as string) || null
  const cost = parseFloat(formData.get('cost') as string)
  const workshop = (formData.get('workshop') as string) || null
  const date = (formData.get('date') as string) || new Date().toISOString()
  const docFiles = formData.getAll('documents') as File[]

  if (!vehicleId) {
    return NextResponse.json(
      { error: 'Vehicle is required' },
      { status: 400 }
    )
  }

  const documentUrls: string[] = []
  for (const file of docFiles) {
    if (file.size > 0) {
      try {
        const url = await uploadFile('maintenance-docs', auth.companyId, file)
        documentUrls.push(url)
      } catch {
        // skip failed uploads
      }
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('maintenance_logs')
    .insert({
      vehicle_id: vehicleId,
      company_id: auth.companyId,
      type,
      description,
      cost: isNaN(cost) ? null : cost,
      workshop,
      date,
      documents: documentUrls.length > 0 ? documentUrls : null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ log: data })
}
