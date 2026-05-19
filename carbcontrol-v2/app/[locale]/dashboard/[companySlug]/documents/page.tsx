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
import { Badge } from '@/components/ui/badge'
import { Plus, ExternalLink, AlertTriangle } from 'lucide-react'

type Vehicle = {
  id: string
  plate: string
  name: string
}

type Driver = {
  id: string
  full_name: string
  email: string
}

type AppDocument = {
  id: string
  entity_type: string
  entity_id: string
  name: string | null
  file_path: string | null
  expiration_date: string | null
  uploaded_at: string
}

function getStatus(expirationDate: string | null): {
  label: string
  variant: 'default' | 'secondary' | 'outline'
} {
  if (!expirationDate) return { label: 'No expiry', variant: 'secondary' }
  const now = new Date()
  const exp = new Date(expirationDate)
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: 'Expired', variant: 'outline' }
  if (diffDays <= 30) return { label: 'Expiring soon', variant: 'default' }
  return { label: 'Valid', variant: 'secondary' }
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<AppDocument[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [filterEntityType, setFilterEntityType] = useState('')
  const [filterEntityId, setFilterEntityId] = useState('')

  const [form, setForm] = useState({
    entityType: 'vehicle',
    entityId: '',
    name: '',
    expirationDate: '',
  })
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const fetchDocuments = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterEntityType) params.set('entityType', filterEntityType)
    if (filterEntityId) params.set('entityId', filterEntityId)

    const res = await fetch(`/api/documents?${params}`)
    const data = await res.json()
    if (res.ok) {
      setDocuments(data.documents || [])
    } else {
      setError(data.error || 'Failed to load documents')
    }
    setLoading(false)
  }, [filterEntityType, filterEntityId])

  const fetchVehicles = useCallback(async () => {
    const res = await fetch('/api/vehicles')
    const data = await res.json()
    if (res.ok) setVehicles(data.vehicles || [])
  }, [])

  const fetchDrivers = useCallback(async () => {
    const res = await fetch('/api/company-users')
    const data = await res.json()
    if (res.ok) {
      setDrivers(
        (data.users || []).filter(
          (u: Driver & { role: string }) => u.role === 'driver'
        )
      )
    }
  }, [])

  useEffect(() => {
    fetchVehicles()
    fetchDrivers()
  }, [fetchVehicles, fetchDrivers])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.entityType) return
    setSubmitting(true)
    setError(null)

    const fd = new FormData()
    fd.set('entityType', form.entityType)
    fd.set(
      'entityId',
      form.entityType === 'company' ? '' : form.entityId
    )
    fd.set('name', form.name)
    fd.set('expirationDate', form.expirationDate)
    if (uploadFile) fd.set('file', uploadFile)

    const res = await fetch('/api/documents', { method: 'POST', body: fd })
    const data = await res.json()
    setSubmitting(false)

    if (res.ok) {
      setDialogOpen(false)
      setForm({
        entityType: 'vehicle',
        entityId: '',
        name: '',
        expirationDate: '',
      })
      setUploadFile(null)
      fetchDocuments()
    } else {
      setError(data.error || 'Failed to upload document')
    }
  }

  const expiringSoon = documents.filter((doc) => {
    if (!doc.expiration_date) return false
    const now = new Date()
    const exp = new Date(doc.expiration_date)
    const diffDays = Math.ceil(
      (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    return diffDays >= 0 && diffDays <= 30
  })

  const entityLabel = (doc: AppDocument) => {
    if (doc.entity_type === 'vehicle') {
      const v = vehicles.find((v) => v.id === doc.entity_id)
      return v ? `${v.plate} - ${v.name}` : doc.entity_id.slice(0, 8)
    }
    if (doc.entity_type === 'driver') {
      const d = drivers.find((d) => d.id === doc.entity_id)
      return d ? d.full_name || d.email : doc.entity_id.slice(0, 8)
    }
    return 'Company'
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Document store with expiry tracking
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="entity-type">Entity Type *</Label>
                <select
                  id="entity-type"
                  value={form.entityType}
                  onChange={(e) => {
                    setForm({ ...form, entityType: e.target.value, entityId: '' })
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="vehicle">Vehicle</option>
                  <option value="driver">Driver</option>
                  <option value="company">Company</option>
                </select>
              </div>
              {form.entityType === 'vehicle' && (
                <div className="space-y-2">
                  <Label htmlFor="entity-id">Vehicle</Label>
                  <select
                    id="entity-id"
                    value={form.entityId}
                    onChange={(e) => setForm({ ...form, entityId: e.target.value })}
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
              )}
              {form.entityType === 'driver' && (
                <div className="space-y-2">
                  <Label htmlFor="entity-id">Driver</Label>
                  <select
                    id="entity-id"
                    value={form.entityId}
                    onChange={(e) => setForm({ ...form, entityId: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select driver</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name || d.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="doc-name">Document Name</Label>
                <Input
                  id="doc-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Insurance Certificate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-file">File *</Label>
                <Input
                  id="doc-file"
                  type="file"
                  required
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration">Expiration Date</Label>
                <Input
                  id="expiration"
                  type="date"
                  value={form.expirationDate}
                  onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {expiringSoon.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                {expiringSoon.length} document(s) expiring within 30 days
              </p>
              <ul className="mt-1 text-xs text-amber-700">
                {expiringSoon.slice(0, 5).map((doc) => (
                  <li key={doc.id}>
                    {doc.name || 'Untitled'} — expires{' '}
                    {doc.expiration_date
                      ? new Date(doc.expiration_date).toLocaleDateString()
                      : 'soon'}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="filter-type">Entity Type</Label>
          <select
            id="filter-type"
            value={filterEntityType}
            onChange={(e) => {
              setFilterEntityType(e.target.value)
              setFilterEntityId('')
            }}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">All types</option>
            <option value="vehicle">Vehicle</option>
            <option value="driver">Driver</option>
            <option value="company">Company</option>
          </select>
        </div>
        {filterEntityType === 'vehicle' && (
          <div className="space-y-2">
            <Label htmlFor="filter-entity">Vehicle</Label>
            <select
              id="filter-entity"
              value={filterEntityId}
              onChange={(e) => setFilterEntityId(e.target.value)}
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
        )}
        {filterEntityType === 'driver' && (
          <div className="space-y-2">
            <Label htmlFor="filter-entity">Driver</Label>
            <select
              id="filter-entity"
              value={filterEntityId}
              onChange={(e) => setFilterEntityId(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All drivers</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name || d.email}
                </option>
              ))}
            </select>
          </div>
        )}
        <Button variant="outline" onClick={fetchDocuments}>
          Filter
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {documents.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No documents found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const status = getStatus(doc.expiration_date)
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {doc.name || 'Untitled'}
                      </TableCell>
                      <TableCell className="capitalize">
                        {doc.entity_type}
                      </TableCell>
                      <TableCell>{entityLabel(doc)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {doc.expiration_date
                          ? new Date(doc.expiration_date).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {doc.file_path ? (
                          <a
                            href={doc.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 text-primary" />
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
