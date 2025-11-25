'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { guestCart } from '@/lib/guest-cart'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'

export default function CheckoutPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { cart, loading, clearCart } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    paymentMethod: 'credit_card',
  })

  // Pre-fill form if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || ''
      }))
    }
  }, [isAuthenticated, user])

  // Redirect if cart is empty
  useEffect(() => {
    if (!loading && (!cart || cart.items.length === 0)) {
      router.push('/basket')
    }
  }, [cart, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cart) return

    // Validate email for guest checkout
    if (!isAuthenticated && !formData.email) {
      alert('Please enter your email address')
      return
    }

    setSubmitting(true)
    try {
      if (isAuthenticated) {
        // Authenticated user order
        const orderData = {
          items: cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shippingAddress: {
            fullName: formData.fullName,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
          },
          paymentMethod: formData.paymentMethod,
        }

        const result = await api.createOrder(orderData)
        await clearCart()
        alert('Order placed successfully!')
        router.push(`/orders?orderId=${result.data.id}`)
      } else {
        // Guest order
        const guestOrderData = {
          items: cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shippingAddress: {
            fullName: formData.fullName,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
          },
          guestEmail: formData.email,
          guestPhone: formData.phone,
          paymentMethod: formData.paymentMethod,
        }

        const result = await api.createGuestOrder(guestOrderData)
        // Clear guest cart after successful order
        guestCart.clearCart()
        // Store order info for tracking
        localStorage.setItem('lastGuestOrder', JSON.stringify({
          orderId: result.data.id,
          email: formData.email
        }))
        alert('Order placed successfully! You can track your order with your email.')
        router.push(`/order-confirmation?orderId=${result.data.id}&email=${encodeURIComponent(formData.email)}`)
      }
    } catch (error: any) {
      alert(error.message || 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!cart) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          {!isAuthenticated && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-blue-800 font-medium">Checking out as guest</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Already have an account?{' '}
                    <Link href="/login" className="underline font-medium">Log in</Link>
                    {' '}for faster checkout and order tracking.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {isAuthenticated ? 'Shipping Information' : 'Contact & Shipping Information'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contact Info for Guests */}
            {!isAuthenticated && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">We'll send your order confirmation here</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="font-medium text-gray-800 mb-4">Shipping Address</h3>
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zip Code
              </label>
              <input
                type="text"
                required
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="paypal">PayPal</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 font-semibold"
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>
          <div className="space-y-4 mb-6">
            {cart.items.map((item) => (
              <div key={item.productId} className="flex justify-between border-b pb-4">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-gray-600">x {item.quantity}</p>
                </div>
                <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-2xl font-bold text-primary-600">
              <span>Total:</span>
              <span>${cart.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}




