'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api, Order } from '@/lib/api-client'

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const orderId = searchParams.get('orderId')
  const email = searchParams.get('email')

  useEffect(() => {
    if (orderId && email) {
      loadOrder()
    } else {
      setError('Order information not found')
      setLoading(false)
    }
  }, [orderId, email])

  const loadOrder = async () => {
    try {
      const data = await api.getGuestOrder(Number(orderId), email!)
      setOrder(data.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load order')
    } finally {
      setLoading(false)
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link
            href="/"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">
            Thank you for your order. We've sent a confirmation to <strong>{email}</strong>
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-primary-600 text-white px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-80">Order Number</p>
                <p className="text-2xl font-bold">#{order?.id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80">Status</p>
                <span className="inline-block bg-white text-primary-600 px-3 py-1 rounded-full text-sm font-medium capitalize">
                  {order?.status}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Order Items */}
            <h2 className="font-semibold text-gray-800 mb-4">Order Items</h2>
            <div className="space-y-3 mb-6">
              {order?.items.map((item, index) => (
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
              <span className="text-2xl font-bold text-primary-600">${order?.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order?.shippingAddress && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Shipping Address
            </h2>
            <div className="text-gray-600">
              <p className="font-medium text-gray-800">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>
        )}

        {/* Track Order Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-800">Track Your Order</h3>
              <p className="text-sm text-blue-700 mt-1">
                Save this page or bookmark it to check your order status. You can also track your order using:
              </p>
              <div className="mt-3 bg-white rounded-lg p-3 border border-blue-200">
                <p className="text-sm text-gray-600">Order ID: <strong className="text-gray-800">#{order?.id}</strong></p>
                <p className="text-sm text-gray-600">Email: <strong className="text-gray-800">{email}</strong></p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-block text-center bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 font-medium"
          >
            Continue Shopping
          </Link>
          <Link
            href="/track-order"
            className="inline-block text-center bg-gray-100 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-200 font-medium"
          >
            Track Order
          </Link>
        </div>
      </div>
    </div>
  )
}

