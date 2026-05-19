'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false })

export default function MapPage() {
  const params = useParams()
  const companySlug = params.companySlug as string
  const locale = params.locale as string

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Live Map</h1>
        <p className="text-sm text-muted-foreground">
          Real-time GPS tracking
        </p>
      </div>
      <LiveMap companySlug={companySlug} locale={locale} />
    </div>
  )
}
