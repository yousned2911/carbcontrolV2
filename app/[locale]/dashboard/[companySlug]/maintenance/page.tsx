'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, Search, ExternalLink } from 'lucide-react'

type Vehicle = {
  id: string
  plate: string
  name: string
}

type MaintenanceLog = {
  id: string
  vehicle_id: string
  type: string | null
  description: string | null
  cost: number | null
  workshop: string | null
  date: string
  documents: string[] | null
  vehicle: { plate: string; name: string } | null
}

export default function MaintenancePage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [filterVehicle, setFilterVehicle] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const [form, setForm] = useState({
    vehicleId: '',
    type: '',
    description: '',
    cost: '',
    workshop: '',
    date: new Date().toISOString().slice(0, 10),
  })
  const [docFiles, setDocFiles] = useState<FileList | null>(null)

  const fetchLogs = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterVehicle) params.set('vehicleId', filterVehicle)
    if (filterFrom) params.set('from', filterFrom)
    if (filterTo) params.set('to', filterTo)

    const res = await fetch(`/api/maintenance-logs?${params}`)
    const data = await res.json()
    if (res.ok) {
      setLogs(data.logs || [])
    } else {
      setError(data.error || 'Failed to load maintenance logs')
    }
    setLoading(false)
  }, [filterVehicle, filterFrom, filterTo])

  const fetchVehicles = useCallback(async () => {
    const res = await fetch('/api/vehicles')
    const data = await res.json()
    if (res.ok) {
      setVehicles(data.vehicles || [])
    }
  }, [])

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vehicleId) return
    setSubmitting(true)
    setError(null)

    const fd = new FormData()
    fd.set('vehicleId', form.vehicleId)
    fd.set('type', form.type)
    fd.set('description', form.description)
    fd.set('cost', form.cost || '0')
    fd.set('workshop', form.workshop)
    fd.set('date', form.date)
    if (docFiles) {
      for (let i = 0; i < docFiles.length; i++) {
        fd.append('documents', docFiles[i])
      }
    }

    const res = await fetch('/api/maintenance-logs', { method: 'POST', body: fd })
    const data = await res.json()
    setSubmitting(false)

    if (res.ok) {
      setDialogOpen(false)
      setForm({
        vehicleId: '',
        type: '',
        description: '',
        cost: '',
        workshop: '',
        date: new Date().toISOString().slice(0, 10),
      })
      setDocFiles(null)
      fetchLogs()
    } else {
      setError(data.error || 'Failed to create maintenance log')
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maintenance Hub</h1>
          <p className="text-sm text-muted-foreground">
            Track vehicle maintenance records
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Maintenance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Maintenance Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle *</Label>
                <select
                  id="vehicle"
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} - {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  placeholder="e.g. Preventive, Corrective, Inspection"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Description of work performed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (MAD)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  placeholder="e.g. 1500.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workshop">Workshop</Label>
                <Input
                  id="workshop"
                  value={form.workshop}
                  onChange={(e) => setForm({ ...form, workshop: e.target.value })}
                  placeholder="Workshop name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="documents">Documents</Label>
                <Input
                  id="documents"
                  type="file"
                  multiple
                  onChange={(e) => setDocFiles(e.target.files)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="filter-vehicle">Vehicle</Label>
          <select
            id="filter-vehicle"
            value={filterVehicle}
            onChange={(e) => setFilterVehicle(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">All vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-from">From</Label>
          <Input
            id="filter-from"
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-to">To</Label>
          <Input
            id="filter-to"
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={fetchLogs}>
          <Search className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No maintenance records found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Workshop</TableHead>
                  <TableHead>Documents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(log.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.vehicle?.plate || '-'}
                    </TableCell>
                    <TableCell>{log.type || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {log.description || '-'}
                    </TableCell>
                    <TableCell>
                      {log.cost != null ? `${log.cost.toFixed(2)} MAD` : '-'}
                    </TableCell>
                    <TableCell>{log.workshop || '-'}</TableCell>
                    <TableCell>
                      {log.documents && log.documents.length > 0 ? (
                        <div className="flex gap-1">
                          {log.documents.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 text-primary" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        '-'
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
