import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'

const locales = ['fr', 'ar']
const defaultLocale = 'fr'

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localeDetection: true,
})

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const hasLocalePrefix = /^\/(fr|ar)(\/|$)/.test(pathname)

  if (!hasLocalePrefix) {
    return intlMiddleware(request)
  }

  const response = intlMiddleware(request)

  if (response.status === 307 || response.status === 308) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const locale = pathname.split('/')[1] || defaultLocale
  const pathWithoutLocale = '/' + pathname.split('/').slice(2).join('/')

  const isAuthPage =
    pathWithoutLocale === '/login' || pathWithoutLocale === '/signup'
  const isAuthCallback = pathWithoutLocale.startsWith('/auth/callback')
  const isOnboarding = pathWithoutLocale === '/onboarding'
  const isMarketingPage =
    pathWithoutLocale === '/' || pathWithoutLocale === ''

  if (isAuthCallback) {
    return response
  }

  if (session && isMarketingPage) {
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  if (!session && !isAuthPage && !isMarketingPage) {
    const loginUrl = new URL(`/${locale}/login`, request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (session && isAuthPage) {
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  if (session && isOnboarding) {
    const { data: userRecord } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', session.user.id)
      .single()

    if (userRecord?.company_id) {
      const dashboardUrl = new URL(`/${locale}/dashboard`, request.url)
      return NextResponse.redirect(dashboardUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
