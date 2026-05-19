import { createClient } from './supabaseServer'
import { cookies } from 'next/headers'
import { createAdminClient } from './supabaseAdmin'

const IMPERSONATE_COOKIE = 'sb-impersonate-company-id'

export type UserRecord = {
  id: string
  email: string | undefined
  role: string
  company_id: string | null
  full_name: string | null
  isImpersonating?: boolean
  impersonatedCompanyId?: string | null
  impersonatedCompanyName?: string | null
  impersonatedCompanySlug?: string | null
}

export async function getUser(): Promise<UserRecord | null> {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) return null

  const { data: userRecord } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!userRecord) return null

  const baseUser: UserRecord = {
    id: session.user.id,
    email: session.user.email,
    role: userRecord.role,
    company_id: userRecord.company_id,
    full_name: userRecord.full_name,
  }

  if (userRecord.role === 'super_admin') {
    const cookieStore = await cookies()
    const impersonateCompanyId = cookieStore.get(IMPERSONATE_COOKIE)?.value

    if (impersonateCompanyId) {
      const supabaseAdmin = createAdminClient()
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('id, name, slug')
        .eq('id', impersonateCompanyId)
        .single()

      if (company) {
        return {
          ...baseUser,
          isImpersonating: true,
          impersonatedCompanyId: company.id,
          impersonatedCompanyName: company.name,
          impersonatedCompanySlug: company.slug,
        }
      }
    }
  }

  return baseUser
}

export function getEffectiveCompanyId(user: UserRecord): string | null {
  if (user.isImpersonating && user.impersonatedCompanyId) {
    return user.impersonatedCompanyId
  }
  return user.company_id
}

export function getEffectiveRole(user: UserRecord): string {
  if (user.role === 'super_admin' && user.isImpersonating) return 'company_admin'
  return user.role
}

export function checkRole(user: UserRecord | null, allowedRoles: string[]): boolean {
  if (!user) return false
  return allowedRoles.includes(user.role)
}

export async function getAuthorizedCompanyId(allowedRoles?: string[]): Promise<{
  companyId: string
  role: string
  userId: string
} | null> {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data: userRecord } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', session.user.id)
    .single()

  if (!userRecord) return null

  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.includes(userRecord.role)
    if (!isAllowed && userRecord.role !== 'super_admin') return null
  }

  let companyId: string | null = userRecord.company_id

  if (userRecord.role === 'super_admin') {
    const cookieStore = await cookies()
    const impersonateCompanyId = cookieStore.get(IMPERSONATE_COOKIE)?.value
    if (impersonateCompanyId) {
      companyId = impersonateCompanyId
    } else {
      return null
    }
  }

  if (!companyId) return null

  return { companyId, role: userRecord.role, userId: session.user.id }
}
