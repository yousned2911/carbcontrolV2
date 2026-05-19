import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { cookies } from 'next/headers'

const IMPERSONATE_COOKIE = 'sb-impersonate-company-id'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', session.user.id)
    .single()

  if (!userRecord) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const cookieStore = await cookies()
  const impersonateCompanyId = cookieStore.get(IMPERSONATE_COOKIE)?.value

  let targetCompanyId: string | null

  if (userRecord.role === 'super_admin') {
    if (!impersonateCompanyId) {
      return NextResponse.json({ error: 'Super admin must impersonate a company first' }, { status: 403 })
    }
    targetCompanyId = impersonateCompanyId
  } else if (userRecord.role === 'company_admin') {
    targetCompanyId = userRecord.company_id
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!targetCompanyId) {
    return NextResponse.json({ error: 'No company context' }, { status: 400 })
  }

  const { email, role: invitedRole, full_name } = await request.json()

  if (!email || !invitedRole) {
    return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
  }

  const validRoles = ['company_admin', 'fleet_manager', 'fuel_manager', 'maintenance_manager', 'driver']
  if (!validRoles.includes(invitedRole)) {
    return NextResponse.json({ error: `Invalid role: ${invitedRole}` }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      role: invitedRole,
      company_id: targetCompanyId,
      full_name: full_name || '',
    },
  })

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, user: inviteData?.user })
}
