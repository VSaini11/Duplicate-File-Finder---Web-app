import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ZeroDup - Advanced Duplicate File Detector',
  description: 'duplicate file detection tool ',
  generator: 'ZeroDup',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
