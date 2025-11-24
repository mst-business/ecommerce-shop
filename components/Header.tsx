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
            
            {isAuthenticated ? (
              <>
                <Link href="/basket" className="relative text-gray-700 hover:text-primary-600 transition-colors">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth="1.5" 
                    stroke="currentColor" 
                    className="w-6 h-6"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" 
                    />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 font-semibold">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
                
                {/* User Dropdown Menu */}
                <div className="relative group">
                  <div className="text-gray-600 cursor-pointer hover:text-primary-600 font-medium py-2">
                    Welcome, {user?.username}
                  </div>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      <Link 
                        href="/orders" 
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors"
                      >
                        My Orders
                      </Link>
                      <Link 
                        href="/admin" 
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors"
                      >
                        Admin
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
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




