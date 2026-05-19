'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'

type Depot = {
  id: string
  name: string
}

type Vehicle = {
  id: string
  name: string
  plate: string
  vin: string | null
  tracker_id: string | null
  fuel_sensor_id: string | null
  depot_id: string | null
  depot: { name: string } | null
}

export default function VehiclesPage() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [depots, setDepots] = useState<Depot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    plate: '',
    vin: '',
    tracker_id: '',
    fuel_sensor_id: '',
    depot_id: '',
  })

  const fetchVehicles = useCallback(async () => {
    const res = await fetch('/api/vehicles')
    const data = await res.json()
    if (res.ok) {
      setVehicles(data.vehicles || [])
    } else {
      setError(data.error || 'Failed to load vehicles')
    }
    setLoading(false)
  }, [])

  const fetchDepots = useCallback(async () => {
    const res = await fetch('/api/depots')
    const data = await res.json()
    if (res.ok) {
      setDepots(data.depots || [])
    }
  }, [])

  useEffect(() => {
    fetchVehicles()
    fetchDepots()
  }, [fetchVehicles, fetchDepots])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        plate: form.plate,
        vin: form.vin || null,
        tracker_id: form.tracker_id || null,
        fuel_sensor_id: form.fuel_sensor_id || null,
        depot_id: form.depot_id || null,
      }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (res.ok) {
      setDialogOpen(false)
      setForm({ name: '', plate: '', vin: '', tracker_id: '', fuel_sensor_id: '', depot_id: '' })
      fetchVehicles()
    } else {
      setError(data.error || 'Failed to create vehicle')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return

    const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setVehicles((prev) => prev.filter((v) => v.id !== id))
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to delete vehicle')
    }
  }

  const filtered = vehicles.filter(
    (v) =>
      v.plate.toLowerCase().includes(search.toLowerCase()) ||
      v.name.toLowerCase().includes(search.toLowerCase())
  )

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
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-sm text-muted-foreground">
            Manage your fleet vehicles
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Vehicle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Vehicle name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plate">Plate *</Label>
                <Input
                  id="plate"
                  value={form.plate}
                  onChange={(e) => setForm({ ...form, plate: e.target.value })}
                  required
                  placeholder="License plate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vin">VIN</Label>
                <Input
                  id="vin"
                  value={form.vin}
                  onChange={(e) => setForm({ ...form, vin: e.target.value })}
                  placeholder="Vehicle identification number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracker_id">Tracker ID</Label>
                <Input
                  id="tracker_id"
                  value={form.tracker_id}
                  onChange={(e) => setForm({ ...form, tracker_id: e.target.value })}
                  placeholder="GPS tracker identifier"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuel_sensor_id">Fuel Sensor ID</Label>
                <Input
                  id="fuel_sensor_id"
                  value={form.fuel_sensor_id}
                  onChange={(e) => setForm({ ...form, fuel_sensor_id: e.target.value })}
                  placeholder="Fuel sensor identifier"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depot">Depot</Label>
                <select
                  id="depot"
                  value={form.depot_id}
                  onChange={(e) => setForm({ ...form, depot_id: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">No depot</option>
                  {depots.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Search by plate or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No vehicles found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Depot</TableHead>
                  <TableHead>Tracker ID</TableHead>
                  <TableHead>Fuel Sensor ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((vehicle) => (
                  <TableRow
                    key={vehicle.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`./vehicles/${vehicle.id}`)}
                  >
                    <TableCell className="font-medium">{vehicle.plate}</TableCell>
                    <TableCell>{vehicle.name}</TableCell>
                    <TableCell>{vehicle.depot?.name || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {vehicle.tracker_id || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {vehicle.fuel_sensor_id || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            alert('Edit functionality coming soon')
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(vehicle.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
