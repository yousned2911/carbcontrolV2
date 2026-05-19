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
} from 'lucide-react'
import { ReactNode, useState, useEffect, useCallback } from 'react'
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
  const canSeeSettings = role === 'company_admin'

  if (canSeeDashboard) mainItems.push({ href: '', label: 'Dashboard', icon: LayoutDashboard })
  if (canSeeLiveMap) mainItems.push({ href: '/map', label: 'Live Map', icon: MapPin })
  if (canSeeVehicles) mainItems.push({ href: '/vehicles', label: 'Vehicles', icon: Truck })
  if (canSeeFuelCenter) mainItems.push({ href: '/fuel', label: 'Fuel Center', icon: Fuel })
  if (canSeeMaintenance) mainItems.push({ href: '/maintenance', label: 'Maintenance Hub', icon: Wrench })
  if (canSeeDocuments) mainItems.push({ href: '/documents', label: 'Documents', icon: FileText })
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
  const isRtl = locale === 'ar'
  const dir = isRtl ? 'rtl' : 'ltr'

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
            className="truncate text-lg font-bold"
          >
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
