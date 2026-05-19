'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { User, Star } from 'lucide-react'

type DriverRecord = {
  id: string
  full_name: string | null
  email: string
  score: number | null
  last_period: string | null
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await fetch('/api/company-users')
        if (res.ok) {
          const data = await res.json()
          const driverUsers = (data.users || []).filter(
            (u: { role: string }) => u.role === 'driver'
          )
          const enriched = await Promise.all(
            driverUsers.map(async (u: DriverRecord) => {
              const scoreRes = await fetch(
                `/api/driver-scores?userId=${u.id}`
              )
              let score: number | null = null
              let lastPeriod: string | null = null
              if (scoreRes.ok) {
                const scoreData = await scoreRes.json()
                if (scoreData.data && scoreData.data.length > 0) {
                  const latest = scoreData.data[0]
                  score = latest.score
                  lastPeriod = latest.period_end || null
                }
              }
              return { ...u, score, last_period: lastPeriod }
            })
          )
          setDrivers(enriched)
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    }
    fetchDrivers()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Driver Scorecard</h1>
        <p className="text-sm text-muted-foreground">
          Monitor driver performance and scores
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {drivers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center">
              <User className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">
                No drivers found in this company.
              </p>
              <p className="text-xs text-muted-foreground">
                Invite users with the driver role to see them here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Last Period</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">
                      {driver.full_name || '-'}
                    </TableCell>
                    <TableCell>{driver.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      Not assigned
                    </TableCell>
                    <TableCell>
                      {driver.score != null ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">
                            {Number(driver.score).toFixed(1)}
                          </span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3.5 w-3.5 ${
                                  s <= Math.round(Number(driver.score) / 2)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No trips recorded
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {driver.last_period
                        ? new Date(driver.last_period).toLocaleDateString()
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
