import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getUser, getEffectiveCompanyId, getEffectiveRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { ImpersonationBanner } from './impersonation-banner'
import { DashboardShell } from './dashboard-shell'

type Props = {
  children: ReactNode
  params: { locale: string; companySlug: string }
}

export default async function DashboardLayout({
  children,
  params: { locale, companySlug },
}: Props) {
  const user = await getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const effectiveCompanyId = getEffectiveCompanyId(user)

  if (!effectiveCompanyId) {
    if (user.role === 'super_admin' && !user.isImpersonating) {
      redirect(`/${locale}/super-admin`)
    }
    redirect(`/${locale}/onboarding`)
  }

  const supabaseAdmin = createAdminClient()
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('id, name, slug')
    .eq('slug', companySlug)
    .single()

  if (!company) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Company not found</h1>
          <p className="text-muted-foreground">
            The company &quot;{companySlug}&quot; does not exist.
          </p>
        </div>
      </div>
    )
  }

  if (company.id !== effectiveCompanyId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have access to this company.
          </p>
        </div>
      </div>
    )
  }

  const effectiveRole = getEffectiveRole(user)

  return (
    <>
      {user.isImpersonating && (
        <ImpersonationBanner
          companyName={user.impersonatedCompanyName || companySlug}
          companySlug={companySlug}
        />
      )}
      <DashboardShell
        locale={locale}
        companySlug={companySlug}
        companyName={company.name}
        userName={user.full_name || user.email || ''}
        userEmail={user.email || ''}
        effectiveRole={effectiveRole}
      >
        {children}
      </DashboardShell>
    </>
  )
}
