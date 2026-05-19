import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabaseServer'

export async function POST(request: Request) {
  const supabase = await createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', session.user.id)
    .single()

  if (userRecord?.company_id) {
    return NextResponse.json(
      { error: 'User already has a company' },
      { status: 400 }
    )
  }

  const { name, slug } = await request.json()

  if (!name || !slug) {
    return NextResponse.json(
      { error: 'Name and slug are required' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: company, error: companyError } = await supabaseAdmin
    .from('companies')
    .insert({ name, slug })
    .select('id, slug')
    .single()

  if (companyError) {
    return NextResponse.json({ error: companyError.message }, { status: 500 })
  }

  const { error: userError } = await supabaseAdmin
    .from('users')
    .update({ company_id: company.id })
    .eq('id', session.user.id)

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  return NextResponse.json({ slug: company.slug })
}
