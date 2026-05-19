'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Truck, Fuel, Wrench, FileText } from 'lucide-react'

type Summary = {
  vehicleCount: number
  fuelThisMonth: { liters: number; cost: number }
  maintenanceThisMonth: { cost: number }
  expiringDocumentsCount: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    fetch('/api/dashboard-summary')
      .then((r) => r.json())
      .then((data) => setSummary(data))
      .catch(() => {})
  }, [])

  const links = [
    {
      label: 'Vehicles',
      icon: Truck,
      count: summary?.vehicleCount ?? 0,
      href: './vehicles',
    },
    {
      label: 'Fuel Center',
      icon: Fuel,
      count: `${summary?.fuelThisMonth.liters.toFixed(0) || 0} L`,
      href: './fuel',
    },
    {
      label: 'Maintenance',
      icon: Wrench,
      count: `${summary?.maintenanceThisMonth.cost.toFixed(0) || 0} MAD`,
      href: './maintenance',
    },
    {
      label: 'Documents',
      icon: FileText,
      count: `${summary?.expiringDocumentsCount || 0} expiring`,
      href: './documents',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Company overview
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <Card
              key={link.href}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => router.push(link.href)}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <Icon className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {link.label}
                  </p>
                  <p className="text-2xl font-bold">{link.count}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
