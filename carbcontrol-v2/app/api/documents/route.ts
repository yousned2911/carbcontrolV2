import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import { getAuthorizedCompanyId } from '@/lib/auth'
import { uploadFile } from '@/lib/upload'

export async function GET(request: Request) {
  const auth = await getAuthorizedCompanyId()
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get('entityType')
  const entityId = searchParams.get('entityId')

  const supabase = await createClient()
  let query = supabase
    .from('documents')
    .select('*')
    .eq('company_id', auth.companyId)
    .order('uploaded_at', { ascending: false })

  if (entityType) query = query.eq('entity_type', entityType)
  if (entityId) query = query.eq('entity_id', entityId)

  const { data: documents, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ documents })
}

export async function POST(request: Request) {
  const auth = await getAuthorizedCompanyId(['company_admin', 'fleet_manager'])
  if (!auth) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const entityType = formData.get('entityType') as string
  const entityId = formData.get('entityId') as string
  const name = (formData.get('name') as string) || null
  const expirationDate = (formData.get('expirationDate') as string) || null
  const file = formData.get('file') as File | null

  if (!entityType) {
    return NextResponse.json(
      { error: 'Entity type is required' },
      { status: 400 }
    )
  }

  const validTypes = ['vehicle', 'driver', 'company']
  if (!validTypes.includes(entityType)) {
    return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
  }

  let filePath: string | null = null
  if (file && file.size > 0) {
    try {
      filePath = await uploadFile('documents', auth.companyId, file)
    } catch {
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documents')
    .insert({
      company_id: auth.companyId,
      entity_type: entityType,
      entity_id: entityId || auth.companyId,
      name,
      file_path: filePath,
      expiration_date: expirationDate || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ document: data })
}
