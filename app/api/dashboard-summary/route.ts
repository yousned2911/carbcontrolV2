import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { getAuthorizedCompanyId } from '@/lib/auth'

export async function GET() {
  const auth = await getAuthorizedCompanyId()
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  ).toISOString()

  const { count: vehicleCount } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', auth.companyId)

  const { data: fuelThisMonth } = await supabase
    .from('fuel_logs')
    .select('liters, cost')
    .eq('company_id', auth.companyId)
    .gte('timestamp', startOfMonth)
    .lte('timestamp', endOfMonth)

  const fuelLiters =
    fuelThisMonth?.reduce((sum, f) => sum + (f.liters || 0), 0) || 0
  const fuelCost =
    fuelThisMonth?.reduce((sum, f) => sum + (f.cost || 0), 0) || 0

  const { data: maintThisMonth } = await supabase
    .from('maintenance_logs')
    .select('cost')
    .eq('company_id', auth.companyId)
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)

  const maintCost =
    maintThisMonth?.reduce((sum, m) => sum + (m.cost || 0), 0) || 0

  const { count: expiringDocs } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', auth.companyId)
    .gte('expiration_date', now.toISOString())
    .lte(
      'expiration_date',
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    )

  return NextResponse.json({
    vehicleCount: vehicleCount || 0,
    fuelThisMonth: { liters: fuelLiters, cost: fuelCost },
    maintenanceThisMonth: { cost: maintCost },
    expiringDocumentsCount: expiringDocs || 0,
  })
}
