import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Service Assistant',
  description: 'AI-powered customer support application',
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