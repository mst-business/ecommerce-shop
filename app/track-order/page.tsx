'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, Order } from '@/lib/api-client'

export default function TrackOrderPage() {
  const router = useRouter()
  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setOrder(null)
    setSearched(true)

    try {
      const data = await api.getGuestOrder(Number(orderId), email)
      setOrder(data.data)
    } catch (err: any) {
      setError(err.message || 'Order not found. Please check your order ID and email.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1
      case 'processing': return 2
      case 'shipped': return 3
      case 'delivered': return 4
      case 'cancelled': return 0
      default: return 0
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Track Your Order</h1>
        <p className="text-gray-600 mb-8">Enter your order number and email to check your order status.</p>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Number
              </label>
              <input
                type="text"
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g., 12345"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="The email used for your order"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 font-semibold transition-colors"
            >
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-primary-600 text-white px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm opacity-80">Order Number</p>
                  <p className="text-2xl font-bold">#{order.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">Order Date</p>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-6">
                <span className="text-gray-600">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>

              {/* Progress Steps */}
              {order.status !== 'cancelled' && (
                <div className="mb-8">
                  <div className="flex items-center justify-between relative">
                    {['Pending', 'Processing', 'Shipped', 'Delivered'].map((step, index) => {
                      const currentStep = getStatusStep(order.status)
                      const isCompleted = index + 1 <= currentStep
                      const isCurrent = index + 1 === currentStep
                      
                      return (
                        <div key={step} className="flex flex-col items-center relative z-10">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isCompleted 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-200 text-gray-400'
                          } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}>
                            {isCompleted ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className="text-sm font-medium">{index + 1}</span>
                            )}
                          </div>
                          <span className={`text-xs mt-2 ${isCompleted ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                            {step}
                          </span>
                        </div>
                      )
                    })}
                    {/* Progress Line */}
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0">
                      <div 
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${((getStatusStep(order.status) - 1) / 3) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <h3 className="font-semibold text-gray-800 mb-4">Order Items</h3>
              <div className="space-y-3 mb-6">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-800">{item.productName}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                    </div>
                    <p className="font-semibold text-gray-800">${item.subtotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-xl font-bold text-gray-800">Total</span>
                <span className="text-2xl font-bold text-primary-600">${order.total.toFixed(2)}</span>
              </div>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">Shipping To</h3>
                  <div className="text-gray-600 text-sm">
                    <p>{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.address}</p>
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No results message */}
        {searched && !order && !error && !loading && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-600">No order found with those details.</p>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Need help?{' '}
            <Link href="/contact" className="text-primary-600 hover:underline font-medium">
              Contact Support
            </Link>
          </p>
          <Link href="/" className="text-primary-600 hover:underline font-medium">
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

