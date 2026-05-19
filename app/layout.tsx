import { ReactNode } from 'react'
import './globals.css'

type Props = {
  children: ReactNode
}

export default function RootLayout({ children }: Props) {
  return (
    <html>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <meta name="theme-color" content="#1e293b" />
      </head>
      <body>{children}</body>
    </html>
  )
}
