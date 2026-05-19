import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import { getAuthorizedCompanyId } from '@/lib/auth'

type Props = {
  params: { id: string }
}

export async function PATCH(request: Request, { params }: Props) {
  const auth = await getAuthorizedCompanyId(['company_admin'])
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name } = await request.json()
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('depots')
    .update({ name: name.trim() })
    .eq('id', params.id)
    .eq('company_id', auth.companyId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Depot not found' }, { status: 404 })
  }

  return NextResponse.json({ depot: data })
}

export async function DELETE(request: Request, { params }: Props) {
  const auth = await getAuthorizedCompanyId(['company_admin'])
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()

  const { count } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('depot_id', params.id)
    .eq('company_id', auth.companyId)

  if (count && count > 0) {
    await supabase
      .from('vehicles')
      .update({ depot_id: null })
      .eq('depot_id', params.id)
      .eq('company_id', auth.companyId)
  }

  const { error } = await supabase
    .from('depots')
    .delete()
    .eq('id', params.id)
    .eq('company_id', auth.companyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, unlinkedVehicles: count || 0 })
}
