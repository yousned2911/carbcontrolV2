'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Props = {
  companyName: string
  companySlug: string
}

export function ImpersonationBanner({ companyName }: Props) {
  const router = useRouter()

  const handleExit = async () => {
    await fetch('/api/super-admin/impersonate', { method: 'DELETE' })
    router.push('/fr/super-admin')
    router.refresh()
  }

  return (
    <div className="bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2 flex items-center justify-between text-sm">
      <span>
        <strong>Impersonating:</strong> {companyName}
      </span>
      <Button variant="outline" size="sm" onClick={handleExit}>
        Exit
      </Button>
    </div>
  )
}
