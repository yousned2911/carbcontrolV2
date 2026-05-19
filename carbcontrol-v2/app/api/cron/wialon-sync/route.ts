import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { wialonRequest } from '@/lib/wialon'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, company_id, tracker_id, fuel_sensor_id, name, plate')
    .not('tracker_id', 'is', null)
    .neq('tracker_id', '')

  if (!vehicles || vehicles.length === 0) {
    return NextResponse.json({ message: 'No vehicles with tracker IDs', processed: 0 })
  }

  const events: { vehicle_id: string; event_type: string; amount_liters: number }[] = []
  const alerts: { company_id: string; vehicle_id: string; rule_type: string; message: string; severity: string }[] = []
  let processed = 0
  let failed = 0

  for (const vehicle of vehicles) {
    try {
      const data = await wialonRequest('messages/load_last', {
        itemId: Number(vehicle.tracker_id),
        lastCount: 1,
        flags: 0,
      })

      if (!Array.isArray(data) || data.length === 0) continue

      const msg = data[0]
      const timestamp = msg.t ? new Date(msg.t * 1000).toISOString() : new Date().toISOString()

      let lat: number | null = null
      let lng: number | null = null
      let speed: number | null = null
      if (msg.p) {
        lng = msg.p.x ?? null
        lat = msg.p.y ?? null
        speed = msg.p.s ?? null
      }

      const ignition = speed != null ? speed > 0 : null

      let fuelLevel: number | null = null
      if (msg.sens && Array.isArray(msg.sens) && vehicle.fuel_sensor_id) {
        const sensorId = Number(vehicle.fuel_sensor_id)
        const sensor = msg.sens.find((s: { id: number; v: number }) => s.id === sensorId)
        if (sensor && typeof sensor.v === 'number') {
          fuelLevel = sensor.v
        }
      }

      const { data: existing } = await supabase
        .from('telemetry')
        .select('id, fuel_level')
        .eq('vehicle_id', vehicle.id)
        .order('timestamp', { ascending: false })
        .limit(1)

      const prevFuelLevel = existing && existing.length > 0 ? existing[0].fuel_level : null

      const { error: insertError } = await supabase.from('telemetry').insert({
        vehicle_id: vehicle.id,
        company_id: vehicle.company_id,
        timestamp,
        lat,
        lng,
        speed,
        fuel_level: fuelLevel,
        ignition,
        raw_data: msg,
      })

      if (insertError) {
        failed++
        continue
      }

      if (fuelLevel != null && prevFuelLevel != null) {
        const diff = fuelLevel - prevFuelLevel
        const threshold = Math.abs(prevFuelLevel) * 0.05

        if (diff > threshold && (speed == null || speed === 0)) {
          events.push({
            vehicle_id: vehicle.id,
            event_type: 'refuel',
            amount_liters: diff,
          })
          await supabase.from('fuel_events').insert({
            vehicle_id: vehicle.id,
            company_id: vehicle.company_id,
            event_type: 'refuel',
            amount_liters: diff,
            timestamp,
            lat,
            lng,
            detected_by: 'sensor',
          })
        } else if (Math.abs(diff) > threshold && diff < 0 && (speed == null || speed === 0)) {
          events.push({
            vehicle_id: vehicle.id,
            event_type: 'drain',
            amount_liters: Math.abs(diff),
          })
          await supabase.from('fuel_events').insert({
            vehicle_id: vehicle.id,
            company_id: vehicle.company_id,
            event_type: 'drain',
            amount_liters: Math.abs(diff),
            timestamp,
            lat,
            lng,
            detected_by: 'sensor',
          })
        }
      }

      if (fuelLevel != null && fuelLevel < 10) {
        alerts.push({
          company_id: vehicle.company_id,
          vehicle_id: vehicle.id,
          rule_type: 'low_fuel',
          message: `Vehicle ${vehicle.plate} (${vehicle.name}) fuel level is ${fuelLevel}%`,
          severity: 'warning',
        })
        await supabase.from('alerts').insert({
          company_id: vehicle.company_id,
          vehicle_id: vehicle.id,
          rule_type: 'low_fuel',
          message: `Vehicle ${vehicle.plate} (${vehicle.name}) fuel level is ${fuelLevel}%`,
          severity: 'warning',
        })
      }

      processed++
    } catch {
      failed++
    }
  }

  return NextResponse.json({
    message: 'Sync completed',
    processed,
    failed,
    eventsDetected: events.length,
    alertsCreated: alerts.length,
  })
}
