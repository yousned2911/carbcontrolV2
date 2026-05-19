'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ROLES = [
  { value: 'company_admin', label: 'Company Admin' },
  { value: 'fleet_manager', label: 'Fleet Manager' },
  { value: 'fuel_manager', label: 'Fuel Manager' },
  { value: 'maintenance_manager', label: 'Maintenance Manager' },
  { value: 'driver', label: 'Driver' },
] as const

type AppUser = {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('driver')
  const [inviteName, setInviteName] = useState('')
  const [inviting, setInviting] = useState(false)

  const fetchUsers = async () => {
    const res = await fetch('/api/company-users')
    const data = await res.json()
    if (res.ok) {
      setUsers(data.users || [])
    } else {
      setError(data.error || 'Failed to load users')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setError(null)

    const res = await fetch('/api/invite-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail,
        role: inviteRole,
        full_name: inviteName,
      }),
    })

    const data = await res.json()
    setInviting(false)

    if (res.ok) {
      setShowInvite(false)
      setInviteEmail('')
      setInviteRole('driver')
      setInviteName('')
      fetchUsers()
    } else {
      setError(data.error || 'Failed to invite user')
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch('/api/company-users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    })

    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to update role')
    }
  }

  const handleRemove = async (userId: string) => {
    if (!confirm('Remove this user from the company?')) return

    const res = await fetch('/api/company-users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })

    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to remove user')
    }
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
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="text-muted-foreground text-sm">
            Gérez les utilisateurs de votre entreprise
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)}>Inviter</Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      {showInvite && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Inviter un utilisateur</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-name">Nom complet (optionnel)</Label>
                <Input
                  id="invite-name"
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Rôle</Label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={inviting}>
                  {inviting ? 'Invitation...' : 'Inviter'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInvite(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="text-muted-foreground text-sm p-6">
              Aucun utilisateur dans cette entreprise.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-3 font-medium">Nom</th>
                    <th className="p-3 font-medium">Email</th>
                    <th className="p-3 font-medium">Rôle</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="p-3">{user.full_name || '-'}</td>
                      <td className="p-3 text-muted-foreground">{user.email}</td>
                      <td className="p-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="rounded border border-input bg-background px-2 py-1 text-xs"
                        >
                          {ROLES.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemove(user.id)}
                        >
                          Retirer
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
  )
}
