# Supabase Storage Setup

## Required Buckets

Create the following buckets in the Supabase Dashboard under Storage:

### 1. `fuel-photos`
- **Purpose**: Store fuel log photo attachments
- **Public**: Read (for displaying photo thumbnails)
- **Insert**: Authenticated users via API (service role key or RLS)
- **Usage**: Upload via `POST /api/fuel-logs`, stored at `{companyId}/{uuid}.{ext}`

### 2. `maintenance-docs`
- **Purpose**: Store maintenance record document attachments
- **Public**: Read
- **Insert**: Authenticated users via API
- **Usage**: Upload via `POST /api/maintenance-logs`, stored at `{companyId}/{uuid}.{ext}`

### 3. `documents`
- **Purpose**: Store company, vehicle, and driver documents
- **Public**: Read
- **Insert**: Authenticated users via API
- **Usage**: Upload via `POST /api/documents`, stored at `{companyId}/{uuid}.{ext}`

## RLS Policies

For each bucket, add the following RLS policy to allow reading by any authenticated user from the same company, and insertion only by authorized roles.

### Policy: Allow SELECT for same-company users

```sql
CREATE POLICY "Users can read files of their company"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('fuel-photos', 'maintenance-docs', 'documents')
  AND (
    -- Extract companyId from the first folder in the path
    (storage.foldername(name))[1]::uuid IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
    -- Allow super_admin to read all
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
);
```

### Policy: Allow INSERT for authorized roles

```sql
CREATE POLICY "Authorized roles can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('fuel-photos', 'maintenance-docs', 'documents')
  AND (
    -- Check user belongs to the company matching the folder path
    (storage.foldername(name))[1]::uuid IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
    -- Allow super_admin
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
);
```

### Alternative: Simpler RLS using request.headers

Since the API routes use the service role key for uploads, RLS on storage.objects is bypassed. The application-layer auth in the API routes is sufficient. RLS policies above are optional if you use the service role key for all storage operations (which is the current approach).

## How to Create Buckets (Supabase Dashboard)

1. Go to Supabase Dashboard → Storage
2. Click "New Bucket"
3. Enter bucket name (e.g., `fuel-photos`)
4. Set "Public bucket" to ON
5. Click "Create bucket"
6. Repeat for `maintenance-docs` and `documents`
7. Optionally add the SQL policies above under the "Policies" tab of each bucket

## File Path Convention

All files are stored under `{companyId}/{uuid}.{ext}` to:
- Organize files by company for easy cleanup
- Enable RLS based on path prefix
- Avoid filename collisions
