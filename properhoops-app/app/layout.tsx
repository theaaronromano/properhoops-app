import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ProperHoops — What Basketball is Talking About',
  description: 'The basketball stories rising fastest across Bluesky, Threads and the Fediverse. Tracked by 500 basketball voices.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ backgroundColor: '#0D0D0D', color: '#fff' }}>
        {children}
      </body>
    </html>
  )
}
