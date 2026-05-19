import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  params: { locale: string }
}

export default function MarketingLayout({ children }: Props) {
  return <>{children}</>
}
