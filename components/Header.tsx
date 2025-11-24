'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    setIsAuthenticated(api.isAuthenticated())
    setUser(api.getCurrentUser())
    updateCartBadge()
  }, [])

  const updateCartBadge = async () => {
    if (api.isAuthenticated()) {
      try {
        const cart = await api.getCart()
        setCartCount(cart.data.itemCount || 0)
      } catch (error) {
        setCartCount(0)
      }
    }
  }

  const handleLogout = () => {
    api.logout()
    setIsAuthenticated(false)
    setUser(null)
    setCartCount(0)
    window.location.href = '/'
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            🛍️ E-Commerce
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-gray-700 hover:text-primary-600 font-medium">
              Home
            </Link>
            <Link href="/categories" className="text-gray-700 hover:text-primary-600 font-medium">
              Categories
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link href="/basket" className="text-gray-700 hover:text-primary-600 font-medium relative">
                  Cart
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link href="/orders" className="text-gray-700 hover:text-primary-600 font-medium">
                  Orders
                </Link>
                <Link href="/admin" className="text-gray-700 hover:text-primary-600 font-medium">
                  Admin
                </Link>
                <span className="text-gray-600">Welcome, {user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-primary-600 font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-primary-600 font-medium">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}




