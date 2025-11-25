import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import Header from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'E-Commerce Store',
  description: 'Modern e-commerce platform built with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}




