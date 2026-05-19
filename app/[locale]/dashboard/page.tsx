import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabaseAdmin'

type Props = {
  params: { locale: string }
}

export default async function DashboardPage({ params: { locale } }: Props) {
  const user = await getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  if (user.role === 'super_admin' && !user.isImpersonating) {
    redirect(`/${locale}/super-admin`)
  }

  const companyId = user.isImpersonating ? user.impersonatedCompanyId : user.company_id

  if (companyId) {
    const supabaseAdmin = createAdminClient()
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('slug')
      .eq('id', companyId)
      .single()

    if (company?.slug) {
      redirect(`/${locale}/dashboard/${company.slug}`)
    }
  }

  redirect(`/${locale}/onboarding`)
}
