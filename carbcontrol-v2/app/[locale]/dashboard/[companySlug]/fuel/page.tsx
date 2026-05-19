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
import { Plus, Search, Fuel } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type Vehicle = {
  id: string
  plate: string
  name: string
}

type FuelLog = {
  id: string
  vehicle_id: string
  liters: number
  cost: number | null
  timestamp: string
  photo_url: string | null
  notes: string | null
  created_by: string | null
  vehicle: { plate: string; name: string } | null
  logger: { full_name: string } | null
}

type TelemetryPoint = {
  id: number
  vehicle_id: string
  lat: number | null
  lng: number | null
  speed: number | null
  fuel_level: number | null
  ignition: boolean | null
  timestamp: string
}

type FuelEvent = {
  id: string
  vehicle_id: string
  event_type: string
  amount_liters: number | null
  timestamp: string
}

export default function FuelPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'sensor'>('manual')
  const [logs, setLogs] = useState<FuelLog[]>([])
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
    liters: '',
    cost: '',
    timestamp: new Date().toISOString().slice(0, 16),
    notes: '',
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const [sensorVehicle, setSensorVehicle] = useState('')
  const [telemetryData, setTelemetryData] = useState<TelemetryPoint[]>([])
  const [fuelEvents, setFuelEvents] = useState<FuelEvent[]>([])
  const [sensorLoading, setSensorLoading] = useState(false)

  const fetchLogs = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterVehicle) params.set('vehicleId', filterVehicle)
    if (filterFrom) params.set('from', filterFrom)
    if (filterTo) params.set('to', filterTo)

    const res = await fetch(`/api/fuel-logs?${params}`)
    const data = await res.json()
    if (res.ok) {
      setLogs(data.logs || [])
    } else {
      setError(data.error || 'Failed to load fuel logs')
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

  const fetchSensorData = useCallback(async () => {
    if (!sensorVehicle) return
    setSensorLoading(true)
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    try {
      const [telemetryRes, eventsRes] = await Promise.all([
        fetch(`/api/telemetry?vehicleId=${sensorVehicle}&from=${from}`),
        fetch(`/api/fuel-events?vehicleId=${sensorVehicle}&from=${from}`),
      ])
      if (telemetryRes.ok) {
        const json = await telemetryRes.json()
        setTelemetryData(json.data || [])
      }
      if (eventsRes.ok) {
        const json = await eventsRes.json()
        setFuelEvents(json.data || [])
      }
    } catch {
      /* ignore */
    } finally {
      setSensorLoading(false)
    }
  }, [sensorVehicle])

  useEffect(() => {
    if (sensorVehicle) fetchSensorData()
  }, [sensorVehicle, fetchSensorData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vehicleId || !form.liters) return
    setSubmitting(true)
    setError(null)

    const fd = new FormData()
    fd.set('vehicleId', form.vehicleId)
    fd.set('liters', form.liters)
    fd.set('cost', form.cost || '0')
    fd.set('timestamp', form.timestamp)
    fd.set('notes', form.notes)
    if (photoFile) fd.set('photo', photoFile)

    const res = await fetch('/api/fuel-logs', { method: 'POST', body: fd })
    const data = await res.json()
    setSubmitting(false)

    if (res.ok) {
      setDialogOpen(false)
      setForm({
        vehicleId: '',
        liters: '',
        cost: '',
        timestamp: new Date().toISOString().slice(0, 16),
        notes: '',
      })
      setPhotoFile(null)
      fetchLogs()
    } else {
      setError(data.error || 'Failed to create fuel log')
    }
  }

  const totalLiters = logs.reduce((sum, l) => sum + (l.liters || 0), 0)
  const totalCost = logs.reduce((sum, l) => sum + (l.cost || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const chartData = telemetryData
    .filter((p) => p.fuel_level != null)
    .map((p) => ({
      time: new Date(p.timestamp).toLocaleTimeString(),
      fuel_level: p.fuel_level,
    }))

  const eventMarkers = fuelEvents
    .filter((e) => e.amount_liters != null)
    .map((e) => ({
      time: new Date(e.timestamp).toLocaleTimeString(),
      amount: e.event_type === 'refuel' ? e.amount_liters : -e.amount_liters!,
      type: e.event_type,
    }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fuel Center</h1>
          <p className="text-sm text-muted-foreground">
            Manual fuel logging and sensor data
          </p>
        </div>
        {activeTab === 'manual' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Fuel Log
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Fuel Log</DialogTitle>
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
                  <Label htmlFor="liters">Liters *</Label>
                  <Input
                    id="liters"
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.liters}
                    onChange={(e) => setForm({ ...form, liters: e.target.value })}
                    required
                    placeholder="e.g. 45.5"
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
                    placeholder="e.g. 450.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timestamp">Date/Time</Label>
                  <Input
                    id="timestamp"
                    type="datetime-local"
                    value={form.timestamp}
                    onChange={(e) => setForm({ ...form, timestamp: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Optional notes"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo">Photo</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
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
        )}
      </div>

      <div className="flex gap-1 rounded-lg border p-1">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'manual'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          Manual Logs
        </button>
        <button
          onClick={() => setActiveTab('sensor')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'sensor'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          Sensor Data
        </button>
      </div>

      {activeTab === 'manual' && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Liters</p>
                <p className="text-2xl font-bold">{totalLiters.toFixed(1)} L</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">{totalCost.toFixed(2)} MAD</p>
              </CardContent>
            </Card>
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
                <p className="p-6 text-sm text-muted-foreground">No fuel logs found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Liters</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Photo</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Logged By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.vehicle?.plate || '-'}
                        </TableCell>
                        <TableCell>{log.liters} L</TableCell>
                        <TableCell>
                          {log.cost != null ? `${log.cost.toFixed(2)} MAD` : '-'}
                        </TableCell>
                        <TableCell>
                          {log.photo_url ? (
                            <a
                              href={log.photo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={log.photo_url}
                                alt="Fuel photo"
                                className="h-10 w-10 rounded object-cover"
                              />
                            </a>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {log.notes || '-'}
                        </TableCell>
                        <TableCell>{log.logger?.full_name || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'sensor' && (
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="sensor-vehicle">Vehicle</Label>
              <select
                id="sensor-vehicle"
                value={sensorVehicle}
                onChange={(e) => setSensorVehicle(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select a vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} - {v.name}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="outline" onClick={fetchSensorData} disabled={!sensorVehicle}>
              <Fuel className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {sensorLoading && (
            <div className="flex items-center justify-center p-12">
              <p className="text-muted-foreground">Loading sensor data...</p>
            </div>
          )}

          {!sensorLoading && sensorVehicle && chartData.length === 0 && (
            <div className="rounded-lg border p-12 text-center">
              <Fuel className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">
                No sensor data available for this vehicle in the last 24 hours.
              </p>
            </div>
          )}

          {!sensorLoading && chartData.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-4 font-semibold">Fuel Level (Last 24 Hours)</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        domain={[0, 100]}
                        label={{
                          value: 'Fuel Level (%)',
                          angle: -90,
                          position: 'insideLeft',
                          style: { fontSize: 11 },
                        }}
                      />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="fuel_level"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        name="Fuel Level"
                      />
                      {eventMarkers.length > 0 && (
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="#22c55e"
                          strokeWidth={0}
                          dot={{ r: 5, fill: '#22c55e' }}
                          name="Events"
                          data={eventMarkers.map((e) => ({
                            time: e.time,
                            amount: e.amount,
                          }))}
                          connectNulls={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {fuelEvents.length > 0 && (
                  <div className="mt-4 space-y-1">
                    <p className="text-sm font-medium">Detected Events</p>
                    {fuelEvents.map((e) => (
                      <div key={e.id} className="flex items-center gap-2 text-sm">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            e.event_type === 'refuel' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <span className="capitalize">{e.event_type}</span>
                        {e.amount_liters != null && (
                          <span className="text-muted-foreground">
                            {e.amount_liters.toFixed(1)} L
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(e.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!sensorVehicle && (
            <div className="rounded-lg border p-12 text-center">
              <Fuel className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">
                Select a vehicle to view its sensor data.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
