'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { createClient } from '@/lib/supabase'
import 'leaflet/dist/leaflet.css'

type TelemetryRecord = {
  vehicle_id: string
  lat: number | null
  lng: number | null
  speed: number | null
  fuel_level: number | null
  ignition: boolean | null
  timestamp: string
  vehicle_name: string | null
  vehicle_plate: string | null
}

type Props = {
  companySlug: string
  locale: string
}

function getStatus(data: TelemetryRecord): 'moving' | 'idling' | 'stopped' | 'nodata' {
  if (data.lat == null || data.lng == null) return 'nodata'
  if (data.speed != null && data.speed > 5) return 'moving'
  if (data.ignition === true) return 'idling'
  return 'stopped'
}

function getColor(status: string): string {
  switch (status) {
    case 'moving':
      return '#22c55e'
    case 'idling':
      return '#f97316'
    case 'stopped':
      return '#ef4444'
    default:
      return '#9ca3af'
  }
}

function FlyToVehicle({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 1 })
  }, [lat, lng, map])
  return null
}

type SidebarProps = {
  vehicles: TelemetryRecord[]
  onSelect: (v: TelemetryRecord) => void
}

function Sidebar({ vehicles, onSelect }: SidebarProps) {
  return (
    <div className="w-72 shrink-0 overflow-y-auto border-r bg-white">
      <div className="border-b p-3">
        <h2 className="font-semibold">Vehicles</h2>
        <p className="text-xs text-muted-foreground">{vehicles.length} vehicles</p>
      </div>
      <div className="divide-y">
        {vehicles.map((v) => {
          const status = getStatus(v)
          return (
            <button
              key={v.vehicle_id}
              onClick={() => onSelect(v)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/50"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: getColor(status) }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {v.vehicle_plate || v.vehicle_name || 'Unknown'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {v.vehicle_name || ''}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {status === 'moving' && v.speed != null
                  ? `${v.speed.toFixed(0)} km/h`
                  : status === 'idling'
                    ? 'Idling'
                    : status === 'stopped'
                      ? 'Stopped'
                      : 'No data'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function LiveMap({ companySlug, locale }: Props) {
  const [vehicles, setVehicles] = useState<TelemetryRecord[]>([])
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const vehiclesRef = useRef(vehicles)
  vehiclesRef.current = vehicles

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        const cid = data.impersonated_company_id || data.company_id
        setCompanyId(cid)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/telemetry/latest')
        const json = await res.json()
        if (res.ok) {
          setVehicles(json.data || [])
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    }
    fetchLatest()
  }, [])

  useEffect(() => {
    if (!companyId) return
    const supabase = createClient()
    const channel = supabase
      .channel('telemetry-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          const vId = row.vehicle_id as string
          setVehicles((prev) => {
            const existing = prev.find((v) => v.vehicle_id === vId)
            if (existing) {
              return prev.map((v) =>
                v.vehicle_id === vId
                  ? {
                      ...v,
                      lat: (row.lat as number) ?? v.lat,
                      lng: (row.lng as number) ?? v.lng,
                      speed: (row.speed as number) ?? v.speed,
                      fuel_level: (row.fuel_level as number) ?? v.fuel_level,
                      ignition: (row.ignition as boolean) ?? v.ignition,
                      timestamp: (row.timestamp as string) ?? v.timestamp,
                    }
                  : v
              )
            }
            return prev
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId])

  const handleSelect = useCallback((v: TelemetryRecord) => {
    if (v.lat != null && v.lng != null) {
      setFlyTo({ lat: v.lat, lng: v.lng })
    }
  }, [])

  const markers = useMemo(() => {
    return vehicles.filter((v) => v.lat != null && v.lng != null)
  }, [vehicles])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 overflow-hidden rounded-lg border">
      <Sidebar vehicles={vehicles} onSelect={handleSelect} />
      <div className="flex-1">
        <MapContainer
          center={[31.7917, -7.0926]}
          zoom={6}
          className="h-full w-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {flyTo && <FlyToVehicle lat={flyTo.lat} lng={flyTo.lng} />}
          {markers.map((v) => {
            const status = getStatus(v)
            return (
              <CircleMarker
                key={v.vehicle_id}
                center={[v.lat!, v.lng!]}
                radius={8}
                pathOptions={{
                  color: getColor(status),
                  fillColor: getColor(status),
                  fillOpacity: 0.7,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="min-w-[180px] space-y-1 text-sm">
                    <p className="font-bold">
                      {v.vehicle_plate || v.vehicle_name || 'Unknown'}
                    </p>
                    {v.vehicle_name && (
                      <p className="text-muted-foreground">{v.vehicle_name}</p>
                    )}
                    <p>
                      Speed:{' '}
                      {v.speed != null ? `${v.speed.toFixed(1)} km/h` : 'N/A'}
                    </p>
                    <p>
                      Fuel:{' '}
                      {v.fuel_level != null
                        ? `${v.fuel_level.toFixed(1)}%`
                        : 'N/A'}
                    </p>
                    <p>
                      Status:{' '}
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </p>
                    {v.timestamp && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(v.timestamp).toLocaleString()}
                      </p>
                    )}
                    <a
                      href={`/${locale}/dashboard/${companySlug}/vehicles/${v.vehicle_id}`}
                      className="mt-1 block text-xs text-blue-600 hover:underline"
                    >
                      View details &rarr;
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
