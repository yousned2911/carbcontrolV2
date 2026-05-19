import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { cookies } from 'next/headers'

const IMPERSONATE_COOKIE = 'sb-impersonate-company-id'

async function getAuthorizedCompanyId() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data: userRecord } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', session.user.id)
    .single()

  if (!userRecord) return null

  if (userRecord.role === 'super_admin') {
    const cookieStore = await cookies()
    const impersonateCompanyId = cookieStore.get(IMPERSONATE_COOKIE)?.value
    return impersonateCompanyId || null
  }

  if (userRecord.role === 'company_admin') {
    return userRecord.company_id
  }

  return null
}

export async function GET() {
  const companyId = await getAuthorizedCompanyId()
  if (!companyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, company_id, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ users })
}

export async function PATCH(request: Request) {
  const companyId = await getAuthorizedCompanyId()
  if (!companyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, role } = await request.json()
  if (!userId || !role) {
    return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
  }

  const validRoles = ['company_admin', 'fleet_manager', 'fuel_manager', 'maintenance_manager', 'driver']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from('users')
    .update({ role })
    .eq('id', userId)
    .eq('company_id', companyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const companyId = await getAuthorizedCompanyId()
  if (!companyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await request.json()
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('id', userId)
    .eq('company_id', companyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
