import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabaseServer'

const IMPERSONATE_COOKIE = 'sb-impersonate-company-id'

export async function POST(request: Request) {
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

  const { companyId, companySlug } = await request.json()
  if (!companyId || !companySlug) {
    return NextResponse.json({ error: 'companyId and companySlug are required' }, { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set(IMPERSONATE_COOKIE, companyId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  })

  return NextResponse.json({ success: true, companyId, companySlug })
}

export async function DELETE() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set(IMPERSONATE_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return NextResponse.json({ success: true })
}
