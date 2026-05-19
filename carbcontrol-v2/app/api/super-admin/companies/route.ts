import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import { createAdminClient } from '@/lib/supabaseAdmin'

export async function GET() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!userRecord || userRecord.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabaseAdmin = createAdminClient()
  const { data: companies, error } = await supabaseAdmin
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ companies })
}
