'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

type Company = {
  id: string
  name: string
  slug: string
  created_at: string
}

type MeResponse = {
  id: string
  role: string
  is_impersonating: boolean
  impersonated_company_id: string | null
  impersonated_company_slug: string | null
}

export default function SuperAdminPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [me, setMe] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data: MeResponse) => {
        if (data.role !== 'super_admin') {
          router.push('/fr/dashboard')
          return
        }
        setMe(data)
      })
      .catch(() => router.push('/fr/login'))
  }, [router])

  useEffect(() => {
    fetch('/api/super-admin/companies')
      .then((res) => res.json())
      .then((data) => {
        if (data.companies) {
          setCompanies(data.companies)
        } else {
          setError(data.error || 'Failed to load companies')
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Network error')
        setLoading(false)
      })
  }, [])

  const handleImpersonate = async (company: Company) => {
    const res = await fetch('/api/super-admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: company.id, companySlug: company.slug }),
    })

    if (res.ok) {
      router.push(`/fr/dashboard/${company.slug}`)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to impersonate')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Super Administration</h1>
          <p className="text-muted-foreground">Gestion de la plateforme</p>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        {me?.is_impersonating && (
          <div className="bg-amber-100 border border-amber-300 text-amber-900 px-4 py-3 rounded-md flex items-center justify-between">
            <span>
              Vous impersonnez actuellement{' '}
              <strong>{me.impersonated_company_slug}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await fetch('/api/super-admin/impersonate', { method: 'DELETE' })
                setMe({ ...me, is_impersonating: false, impersonated_company_id: null, impersonated_company_slug: null })
                router.refresh()
              }}
            >
              Quitter
            </Button>
          </div>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Entreprises ({companies.length})</h2>
          </CardHeader>
          <CardContent>
            {companies.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune entreprise inscrite.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Nom</th>
                      <th className="pb-3 font-medium">Slug</th>
                      <th className="pb-3 font-medium">Créée le</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id} className="border-b last:border-0">
                        <td className="py-3">{company.name}</td>
                        <td className="py-3 text-muted-foreground">{company.slug}</td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(company.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleImpersonate(company)}
                          >
                            Impersonner
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
