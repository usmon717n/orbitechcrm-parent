import type { Metadata, Viewport } from 'next'
import { Archivo_Black, Montserrat, Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import AuthProvider from '@/components/AuthProvider'
import ThemeProvider from '@/components/ThemeProvider'
import ToastSoundEffect from '@/components/ToastSoundEffect'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
})
const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-brand',
})

export const metadata: Metadata = {
  title: "Orbitech CRM — Ta'lim markazi",
  description: "Ta'lim markazi boshqaruv tizimi",
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg?v=3',
    shortcut: '/icon.svg?v=3',
    apple: '/logo/image.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Orbitech CRM',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#468432',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${montserrat.className} ${archivoBlack.variable} ${inter.variable} font-sans`}>
        <ThemeProvider />
        <AuthProvider>
          {children}
        </AuthProvider>
        <ToastSoundEffect />
        <Toaster
          position="top-center"
          containerStyle={{ top: 'max(env(safe-area-inset-top), 16px)' }}
          gutter={10}
          toastOptions={{
            duration: 3000,
            className: 'toast-premium',
            style: {
              background: 'var(--toast-bg)',
              border: '1px solid var(--toast-border)',
              borderRadius: '18px',
              boxShadow: 'var(--toast-shadow)',
              color: 'var(--toast-text)',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '-0.012em',
              padding: '13px 18px 13px 14px',
              minHeight: '52px',
              maxWidth: '420px',
            },
            success: {
              iconTheme: {
                primary: 'var(--accent)',
                secondary: 'var(--accent-foreground)',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
            loading: {
              iconTheme: {
                primary: 'var(--accent)',
                secondary: 'var(--accent-foreground)',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
