'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

type Props = {
  params: { locale: string }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function OnboardingPage({ params: { locale } }: Props) {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.error || data.company_id) {
          router.push(`/${locale}/dashboard`)
        } else {
          setCheckingAccess(false)
        }
      })
      .catch(() => {
        router.push(`/${locale}/login`)
      })
  }, [locale, router])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setCompanyName(name)
    if (!slugEdited) {
      setSlug(generateSlug(name))
    }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(generateSlug(e.target.value))
    setSlugEdited(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName, slug }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      router.push(`/${locale}/dashboard/${data.slug}`)
      router.refresh()
    } catch {
      setError('Network error')
      setLoading(false)
    }
  }

  if (checkingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">
            Créer votre entreprise
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Configurez votre espace de travail
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l{'\''}entreprise</Label>
              <Input
                id="companyName"
                type="text"
                value={companyName}
                onChange={handleNameChange}
                required
                placeholder="Ma société de transport"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (identifiant unique)</Label>
              <Input
                id="slug"
                type="text"
                value={slug}
                onChange={handleSlugChange}
                required
                placeholder="ma-societe-de-transport"
              />
              <p className="text-xs text-muted-foreground">
                Utilisé dans l{'\''}URL : /dashboard/{slug || '...'}
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Création...' : 'Créer mon entreprise'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
