'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Bell, AlertTriangle, Info, AlertCircle, CheckCheck } from 'lucide-react'

type AlertRecord = {
  id: string
  vehicle_id: string | null
  rule_type: string
  message: string | null
  severity: string
  acknowledged: boolean
  created_at: string
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts')
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.data || [])
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const acknowledgeAlert = async (id: string) => {
    await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, acknowledged: true }),
    })
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    )
  }

  const severityIcon = (sev: string) => {
    switch (sev) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

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
        <h1 className="text-2xl font-bold">Alerts</h1>
        <p className="text-sm text-muted-foreground">
          All alerts and notifications
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center">
              <Bell className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No alerts yet.</p>
              <p className="text-xs text-muted-foreground">
                Alerts will appear here when triggered by telemetry events.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow
                    key={alert.id}
                    className={
                      !alert.acknowledged ? 'bg-muted/50' : undefined
                    }
                  >
                    <TableCell>
                      <span className="text-sm font-medium capitalize">
                        {alert.rule_type.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {alert.message || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {severityIcon(alert.severity)}
                        <span className="text-sm capitalize">{alert.severity}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(alert.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {!alert.acknowledged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      )}
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
