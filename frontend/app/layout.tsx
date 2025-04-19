import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Document Query System',
  description: 'A system for querying documents using AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
