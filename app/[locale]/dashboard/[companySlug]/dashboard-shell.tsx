'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Truck,
  Fuel,
  Wrench,
  FileText,
  BarChart3,
  MapPin,
  Users,
  Warehouse,
  LogOut,
  Globe,
  Menu,
  X,
  Bell,
  User,
} from 'lucide-react'
import { ReactNode, useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

type NavGroup = {
  label?: string
  items: NavItem[]
}

type Props = {
  locale: string
  companySlug: string
  companyName: string
  userName: string
  userEmail: string
  effectiveRole: string
  children: ReactNode
}

function getNavGroups(role: string): NavGroup[] {
  const groups: NavGroup[] = []
  const mainItems: NavItem[] = []

  if (role === 'driver') {
    mainItems.push({ href: '/my-page', label: 'My Page', icon: LayoutDashboard })
    groups.push({ items: mainItems })
    return groups
  }

  const canSeeDashboard = ['company_admin', 'fleet_manager'].includes(role)
  const canSeeVehicles = ['company_admin', 'fleet_manager'].includes(role)
  const canSeeFuelCenter = ['company_admin', 'fleet_manager', 'fuel_manager'].includes(role)
  const canSeeMaintenance = ['company_admin', 'fleet_manager', 'maintenance_manager'].includes(role)
  const canSeeDocuments = role === 'company_admin'
  const canSeeReports = ['company_admin', 'fleet_manager'].includes(role)
  const canSeeLiveMap = ['company_admin', 'fleet_manager'].includes(role)
  const canSeeDrivers = ['company_admin', 'fleet_manager'].includes(role)
  const canSeeAlerts = !['driver'].includes(role)
  const canSeeSettings = role === 'company_admin'

  if (canSeeDashboard) mainItems.push({ href: '', label: 'Dashboard', icon: LayoutDashboard })
  if (canSeeLiveMap) mainItems.push({ href: '/map', label: 'Live Map', icon: MapPin })
  if (canSeeVehicles) mainItems.push({ href: '/vehicles', label: 'Vehicles', icon: Truck })
  if (canSeeDrivers) mainItems.push({ href: '/drivers', label: 'Drivers', icon: User })
  if (canSeeFuelCenter) mainItems.push({ href: '/fuel', label: 'Fuel Center', icon: Fuel })
  if (canSeeMaintenance) mainItems.push({ href: '/maintenance', label: 'Maintenance Hub', icon: Wrench })
  if (canSeeDocuments) mainItems.push({ href: '/documents', label: 'Documents', icon: FileText })
  if (canSeeAlerts) mainItems.push({ href: '/alerts', label: 'Alerts', icon: Bell })
  if (canSeeReports) mainItems.push({ href: '/reports', label: 'Reports', icon: BarChart3 })

  if (mainItems.length > 0) groups.push({ items: mainItems })

  if (canSeeSettings) {
    groups.push({
      label: 'Settings',
      items: [
        { href: '/settings/users', label: 'User Management', icon: Users },
        { href: '/settings/depots', label: 'Depots', icon: Warehouse },
      ],
    })
  }

  return groups
}

export function DashboardShell({
  locale,
  companySlug,
  companyName,
  userName,
  userEmail,
  effectiveRole,
  children,
}: Props) {
  const pathname = usePathname()
  const basePath = `/${locale}/dashboard/${companySlug}`
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [alertDropdownOpen, setAlertDropdownOpen] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const [recentAlerts, setRecentAlerts] = useState<
    { id: string; message: string | null; severity: string; created_at: string }[]
  >([])
  const isRtl = locale === 'ar'
  const dir = isRtl ? 'rtl' : 'ltr'
  const alertRef = useRef<HTMLDivElement>(null)

  const navGroups = getNavGroups(effectiveRole)

  function isActive(href: string) {
    const fullPath = basePath + href
    if (href === '') return pathname === basePath || pathname === basePath + '/'
    return pathname === fullPath || pathname.startsWith(fullPath + '/')
  }

  const handleLogout = useCallback(async () => {
    setMenuOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = `/${locale}/login`
  }, [locale])

  useEffect(() => {
    if (!menuOpen) return
    const handler = () => setMenuOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [menuOpen])

  useEffect(() => {
    if (!alertDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (alertRef.current && !alertRef.current.contains(e.target as Node)) {
        setAlertDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [alertDropdownOpen])

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/alerts')
        if (res.ok) {
          const data = await res.json()
          const unacknowledged = (data.data || []).filter(
            (a: { acknowledged: boolean }) => !a.acknowledged
          )
          setAlertCount(unacknowledged.length)
          setRecentAlerts((data.data || []).slice(0, 5))
        }
      } catch {
        /* ignore */
      }
    }
    fetchAlerts()
  }, [])

  useEffect(() => {
    const supabaseClient = createClient()
    const channel = supabaseClient
      .channel('alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          setAlertCount((c) => c + 1)
          setRecentAlerts((prev) => [
            {
              id: row.id as string,
              message: (row.message as string) || null,
              severity: row.severity as string,
              created_at: (row.created_at as string) || new Date().toISOString(),
            },
            ...prev.slice(0, 4),
          ])
        }
      )
      .subscribe()

    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [])

  const toggleLocale = isRtl ? 'fr' : 'ar'
  const togglePath = pathname.replace(`/${locale}`, `/${toggleLocale}`)

  return (
    <div dir={dir} className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 z-50 flex w-64 flex-col bg-white transition-transform lg:static lg:z-auto lg:translate-x-0',
          isRtl ? 'right-0 border-l' : 'left-0 border-r',
          sidebarOpen
            ? 'translate-x-0'
            : isRtl
              ? 'translate-x-full'
              : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link
            href={basePath}
            className="flex items-center gap-2 truncate text-lg font-bold"
          >
            <img src="/logo.svg" alt="CarbControl" className="h-6 w-6" />
            {companyName}
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {navGroups.map((group, i) => (
            <div key={i} className="mb-6">
              {group.label && (
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {group.label}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <li key={item.href}>
                      <Link
                        href={basePath + item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b bg-white px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1 hover:bg-gray-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {effectiveRole !== 'driver' && (
              <div className="relative" ref={alertRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setAlertDropdownOpen(!alertDropdownOpen)
                  }}
                  className="relative rounded-lg p-1.5 transition-colors hover:bg-gray-100"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  {alertCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {alertCount > 99 ? '99+' : alertCount}
                    </span>
                  )}
                </button>

                {alertDropdownOpen && (
                  <div
                    className={cn(
                      'absolute mt-2 w-80 rounded-md border bg-white shadow-lg',
                      isRtl ? 'left-0' : 'right-0'
                    )}
                  >
                    <div className="border-b px-3 py-2">
                      <p className="text-sm font-semibold">Notifications</p>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {recentAlerts.length === 0 ? (
                        <p className="p-4 text-center text-sm text-muted-foreground">
                          No notifications
                        </p>
                      ) : (
                        recentAlerts.map((a) => (
                          <div key={a.id} className="border-b px-3 py-2.5 last:border-b-0">
                            <div className="flex items-start gap-2">
                              <span
                                className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                                  a.severity === 'critical'
                                    ? 'bg-red-500'
                                    : a.severity === 'warning'
                                      ? 'bg-orange-500'
                                      : 'bg-blue-500'
                                }`}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-sm text-gray-700">
                                  {a.message || 'No message'}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {new Date(a.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-t p-2">
                      <Link
                        href={basePath + '/alerts'}
                        onClick={() => setAlertDropdownOpen(false)}
                        className="block rounded px-2 py-1.5 text-center text-sm font-medium text-primary hover:bg-accent"
                      >
                        View All
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link
              href={togglePath}
              className="flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-gray-900"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{toggleLocale.toUpperCase()}</span>
            </Link>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(!menuOpen)
                }}
                className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-gray-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                  {(userName || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="hidden max-w-[120px] truncate text-sm text-gray-700 md:inline">
                  {userName || userEmail}
                </span>
              </button>

              {menuOpen && (
                <div
                  className={cn(
                    'absolute mt-1 w-48 rounded-md border bg-white shadow-lg',
                    isRtl ? 'left-0' : 'right-0'
                  )}
                >
                  <div className="border-b px-3 py-2">
                    <p className="truncate text-sm font-medium">{userName}</p>
                    <p className="truncate text-xs text-gray-500">{userEmail}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
