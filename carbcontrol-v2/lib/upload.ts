import { createAdminClient } from './supabaseAdmin'

export async function uploadFile(
  bucket: string,
  companyId: string,
  file: File
): Promise<string> {
  const supabase = createAdminClient()
  const ext = file.name.split('.').pop() || 'bin'
  const filePath = `${companyId}/${crypto.randomUUID()}.${ext}`
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) throw new Error(error.message)

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return urlData.publicUrl
}
