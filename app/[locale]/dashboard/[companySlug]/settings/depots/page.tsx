'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, Pencil, Trash2, Save, X, MapPin } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import dynamic from 'next/dynamic'

const GeofenceEditor = dynamic(() => import('@/components/GeofenceEditor'), { ssr: false })

type Depot = {
  id: string
  name: string
  geofence: Record<string, unknown> | null
  vehicle_count?: number
}

export default function DepotsPage() {
  const [depots, setDepots] = useState<Depot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [geofenceDepot, setGeofenceDepot] = useState<Depot | null>(null)
  const [geofenceDialogOpen, setGeofenceDialogOpen] = useState(false)

  const fetchDepots = useCallback(async () => {
    const res = await fetch('/api/depots')
    const data = await res.json()
    if (res.ok) {
      const depotsWithCount = await Promise.all(
        (data.depots || []).map(async (depot: Depot) => {
          const vres = await fetch(`/api/vehicles`)
          const vdata = await vres.json()
          const count = (vdata.vehicles || []).filter(
            (v: { depot_id: string }) => v.depot_id === depot.id
          ).length
          return { ...depot, vehicle_count: count }
        })
      )
      setDepots(depotsWithCount)
    } else {
      setError(data.error || 'Failed to load depots')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDepots()
  }, [fetchDepots])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    setError(null)

    const res = await fetch('/api/depots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })

    const data = await res.json()
    setAdding(false)

    if (res.ok) {
      setNewName('')
      fetchDepots()
    } else {
      setError(data.error || 'Failed to create depot')
    }
  }

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return

    const res = await fetch(`/api/depots/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    })

    const data = await res.json()

    if (res.ok) {
      setEditingId(null)
      setEditName('')
      fetchDepots()
    } else {
      setError(data.error || 'Failed to update depot')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this depot? Vehicles assigned to it will be unlinked.')) return

    const res = await fetch(`/api/depots/${id}`, { method: 'DELETE' })
    const data = await res.json()

    if (res.ok) {
      if (data.unlinkedVehicles > 0) {
        setError(`${data.unlinkedVehicles} vehicle(s) were unlinked from this depot.`)
      }
      fetchDepots()
    } else {
      setError(data.error || 'Failed to delete depot')
    }
  }

  const startEdit = (depot: Depot) => {
    setEditingId(depot.id)
    setEditName(depot.name)
  }

  const openGeofence = (depot: Depot) => {
    setGeofenceDepot(depot)
    setGeofenceDialogOpen(true)
  }

  const handleGeofenceSave = async (geojson: Record<string, unknown>) => {
    if (!geofenceDepot) return
    const fenceValue = Object.keys(geojson).length > 0 ? geojson : null
    await fetch(`/api/depots/${geofenceDepot.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ geofence: fenceValue }),
    })
    setGeofenceDialogOpen(false)
    setGeofenceDepot(null)
    fetchDepots()
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
        <h1 className="text-2xl font-bold">Depots</h1>
        <p className="text-sm text-muted-foreground">
          Manage your company depots
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 inline-flex items-center"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="new-depot">Add Depot</Label>
          <Input
            id="new-depot"
            placeholder="Depot name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <Button onClick={handleAdd} disabled={adding || !newName.trim()}>
          <Plus className="mr-2 h-4 w-4" />
          {adding ? 'Adding...' : 'Add'}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {depots.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No depots yet. Add your first depot above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead>Geofence</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depots.map((depot) => (
                  <TableRow key={depot.id}>
                    <TableCell>
                      {editingId === depot.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(depot.id)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="font-medium">{depot.name}</span>
                      )}
                    </TableCell>
                    <TableCell>{depot.vehicle_count ?? 0}</TableCell>
                    <TableCell>
                      {depot.geofence ? (
                        <span className="text-xs text-green-600">Defined</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId !== depot.id && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openGeofence(depot)}
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(depot)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(depot.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={geofenceDialogOpen} onOpenChange={setGeofenceDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Edit Geofence — {geofenceDepot?.name || ''}
            </DialogTitle>
          </DialogHeader>
          {geofenceDepot && (
            <GeofenceEditor onSave={handleGeofenceSave} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
