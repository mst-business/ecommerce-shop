import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import Header from '@/components/Header'

const dmSans = DM_Sans({ 
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'StoreHub - Modern E-Commerce',
  description: 'Discover amazing products at great prices. Free shipping on orders over $50.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className={`${dmSans.className} antialiased`}>
        <Providers>
          <Header />
          <main className="min-h-screen bg-surface-50">
            {children}
          </main>
          {/* Footer */}
          <footer className="bg-gray-900 text-gray-400 py-12">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <span className="text-xl font-bold text-white">StoreHub</span>
                  </div>
                  <p className="text-sm">
                    Your one-stop shop for amazing products at great prices.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-4">Shop</h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/categories" className="hover:text-white transition-colors">All Categories</a></li>
                    <li><a href="/" className="hover:text-white transition-colors">New Arrivals</a></li>
                    <li><a href="/" className="hover:text-white transition-colors">Best Sellers</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-4">Support</h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/track-order" className="hover:text-white transition-colors">Track Order</a></li>
                    <li><a href="/" className="hover:text-white transition-colors">Shipping Info</a></li>
                    <li><a href="/" className="hover:text-white transition-colors">Returns</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-4">Stay Connected</h4>
                  <p className="text-sm mb-4">Subscribe for exclusive deals and updates.</p>
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      placeholder="Enter email" 
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary-500"
                    />
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                      →
                    </button>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
                <p>© 2024 StoreHub. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}




