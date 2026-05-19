import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import { getUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabaseAdmin'

export async function GET() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let companySlug: string | null = null
  const companyId = user.isImpersonating ? user.impersonatedCompanyId : user.company_id

  if (companyId) {
    const supabaseAdmin = createAdminClient()
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('slug')
      .eq('id', companyId)
      .single()
    companySlug = company?.slug ?? null
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
    company_id: user.company_id,
    company_slug: companySlug,
    is_impersonating: user.isImpersonating || false,
    impersonated_company_id: user.impersonatedCompanyId || null,
    impersonated_company_name: user.impersonatedCompanyName || null,
    impersonated_company_slug: user.impersonatedCompanySlug || null,
  })
}
