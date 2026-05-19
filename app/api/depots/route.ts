import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import { getAuthorizedCompanyId } from '@/lib/auth'

export async function GET() {
  const auth = await getAuthorizedCompanyId()
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: depots, error } = await supabase
    .from('depots')
    .select('*')
    .eq('company_id', auth.companyId)
    .order('name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ depots })
}

export async function POST(request: Request) {
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
    .insert({ company_id: auth.companyId, name: name.trim() })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ depot: data })
}
