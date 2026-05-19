'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, MapPin, Gauge, Fuel, Info } from 'lucide-react'
import dynamic from 'next/dynamic'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const MiniMap = dynamic(() => import('@/components/MiniMap'), { ssr: false })

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

type Telemetry = {
  lat: number | null
  lng: number | null
  speed: number | null
  fuel_level: number | null
  ignition: boolean | null
  timestamp: string
}

type FuelLog = {
  id: string
  liters: number
  cost: number | null
  timestamp: string
  notes: string | null
  logger: { full_name: string } | null
}

type MaintenanceLog = {
  id: string
  type: string | null
  description: string | null
  cost: number | null
  workshop: string | null
  date: string
}

type Document = {
  id: string
  name: string | null
  file_path: string | null
  expiration_date: string | null
}

export default function VehicleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null)
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([])
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'fuel' | 'maintenance' | 'documents'>('info')

  const vehicleId = params.id as string

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [vehicleRes, telemetryRes] = await Promise.all([
          fetch(`/api/vehicles/${vehicleId}`),
          fetch(`/api/telemetry/latest`),
        ])

        if (vehicleRes.ok) {
          const data = await vehicleRes.json()
          setVehicle(data.vehicle)
        }

        if (telemetryRes.ok) {
          const data = await telemetryRes.json()
          const rows = (data.data || []) as Telemetry[]
          const row = rows.find((r: Record<string, unknown>) => r.vehicle_id === vehicleId)
          if (row) {
            setTelemetry({
              lat: row.lat,
              lng: row.lng,
              speed: row.speed,
              fuel_level: row.fuel_level,
              ignition: row.ignition,
              timestamp: row.timestamp,
            })
          }
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [vehicleId])

  const fetchFuelLogs = useCallback(async () => {
    const res = await fetch(`/api/fuel-logs?vehicleId=${vehicleId}`)
    if (res.ok) {
      const data = await res.json()
      setFuelLogs(data.logs || [])
    }
  }, [vehicleId])

  const fetchMaintenance = useCallback(async () => {
    const res = await fetch(`/api/maintenance-logs?vehicleId=${vehicleId}`)
    if (res.ok) {
      const data = await res.json()
      setMaintenanceLogs(data.logs || [])
    }
  }, [vehicleId])

  const fetchDocuments = useCallback(async () => {
    const res = await fetch(`/api/documents?entityType=vehicle&entityId=${vehicleId}`)
    if (res.ok) {
      const data = await res.json()
      setDocuments(data.documents || [])
    }
  }, [vehicleId])

  useEffect(() => {
    if (activeTab === 'fuel') fetchFuelLogs()
    if (activeTab === 'maintenance') fetchMaintenance()
    if (activeTab === 'documents') fetchDocuments()
  }, [activeTab, fetchFuelLogs, fetchMaintenance, fetchDocuments])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Vehicle not found</h1>
        </div>
      </div>
    )
  }

  const tabs = [
    { key: 'info', label: 'Info', icon: Info },
    { key: 'fuel', label: 'Fuel', icon: Fuel },
    { key: 'maintenance', label: 'Maintenance', icon: null },
    { key: 'documents', label: 'Documents', icon: null },
  ] as const

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div>
        <h1 className="text-2xl font-bold">{vehicle.plate}</h1>
        <p className="text-sm text-muted-foreground">{vehicle.name}</p>
      </div>

      {}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Gauge className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Speed</p>
              <p className="text-lg font-bold">
                {telemetry?.speed != null ? `${telemetry.speed.toFixed(0)} km/h` : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Fuel className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Fuel Level</p>
              <p className="text-lg font-bold">
                {telemetry?.fuel_level != null ? `${telemetry.fuel_level.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-lg font-bold">
                {telemetry?.ignition === true
                  ? telemetry.speed != null && telemetry.speed > 0
                    ? 'Moving'
                    : 'Idling'
                  : telemetry?.ignition === false
                    ? 'Stopped'
                    : 'No Data'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {}
      <div className="flex gap-1 rounded-lg border p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'info' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <div className="border-b p-4">
              <h3 className="font-semibold">Vehicle Details</h3>
            </div>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{vehicle.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plate</span>
                <span className="font-medium">{vehicle.plate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VIN</span>
                <span className="font-medium">{vehicle.vin || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tracker ID</span>
                <span className="font-medium">{vehicle.tracker_id || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fuel Sensor ID</span>
                <span className="font-medium">{vehicle.fuel_sensor_id || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Depot</span>
                <span className="font-medium">{vehicle.depot?.name || '-'}</span>
              </div>
            </CardContent>
          </Card>

          {telemetry?.lat != null && telemetry?.lng != null ? (
            <Card>
              <div className="border-b p-4">
                <h3 className="font-semibold">Current Location</h3>
              </div>
              <CardContent className="p-4">
                <MiniMap lat={telemetry.lat} lng={telemetry.lng} />
                {telemetry.timestamp && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Last updated: {new Date(telemetry.timestamp).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center p-12">
                <p className="text-sm text-muted-foreground">No location data available</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'fuel' && (
        <div className="space-y-4">
          {}
          {fuelLogs.length > 0 && (
            <Card>
              <div className="border-b p-4">
                <h3 className="font-semibold">Manual Fuel Logs</h3>
              </div>
              <CardContent className="p-0">
                {fuelLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between border-b px-4 py-3 last:border-b-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {log.liters} L
                        {log.cost != null && ` - ${log.cost.toFixed(2)} MAD`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                        {log.logger?.full_name && ` by ${log.logger.full_name}`}
                      </p>
                    </div>
                    {log.notes && (
                      <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {log.notes}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {}
          <Card>
            <div className="border-b p-4">
              <h3 className="font-semibold">Sensor Fuel Level (Last 24h)</h3>
            </div>
            <CardContent className="p-4">
              <SensorChart vehicleId={vehicleId} />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <Card>
          <div className="border-b p-4">
            <h3 className="font-semibold">Maintenance Logs</h3>
          </div>
          <CardContent className="p-4">
            {maintenanceLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No maintenance records.</p>
            ) : (
              <div className="space-y-2">
                {maintenanceLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{log.type || 'General'}</span>
                      {log.cost != null && (
                        <span className="text-muted-foreground">
                          {log.cost.toFixed(2)} MAD
                        </span>
                      )}
                    </div>
                    {log.description && (
                      <p className="mt-1 text-muted-foreground">{log.description}</p>
                    )}
                    <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                      <span>{new Date(log.date).toLocaleDateString()}</span>
                      {log.workshop && <span>{log.workshop}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card>
          <div className="border-b p-4">
            <h3 className="font-semibold">Documents</h3>
          </div>
          <CardContent className="p-4">
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents for this vehicle.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="rounded-lg border p-3 text-sm">
                    <p className="font-medium">{doc.name || 'Unnamed document'}</p>
                    {doc.file_path && (
                      <a
                        href={doc.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View file
                      </a>
                    )}
                    {doc.expiration_date && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(doc.expiration_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SensorChart({ vehicleId }: { vehicleId: string }) {
  const [data, setData] = useState<{ time: string; fuel_level: number | null }[]>([])

  useEffect(() => {
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    fetch(`/api/telemetry?vehicleId=${vehicleId}&from=${from}`)
      .then((r) => r.json())
      .then((json) => {
        const points = (json.data || [])
          .filter((p: { fuel_level: number | null }) => p.fuel_level != null)
          .map((p: { fuel_level: number; timestamp: string }) => ({
            time: new Date(p.timestamp).toLocaleTimeString(),
            fuel_level: p.fuel_level,
          }))
        setData(points)
      })
      .catch(() => {})
  }, [vehicleId])

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No sensor data available.</p>
  }

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="fuel_level"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
