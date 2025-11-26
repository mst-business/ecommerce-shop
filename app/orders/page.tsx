'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api, Order } from '@/lib/api-client'

function OrdersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push('/login')
      return
    }
    loadOrders()
  }, [])

  useEffect(() => {
    if (orderId) {
      const order = orders.find(o => o.id === Number(orderId))
      if (order) setSelectedOrder(order)
    }
  }, [orderId, orders])

  const loadOrders = async () => {
    try {
      const data = await api.getOrders()
      setOrders(data.data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
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

  if (selectedOrder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href="/orders" className="text-primary-600 hover:underline mb-4 inline-block">
          ← Back to Orders
        </Link>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Order #{selectedOrder.id}</h1>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)}`}>
              {selectedOrder.status.toUpperCase()}
            </span>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Items</h2>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-left">Price</th>
                  <th className="px-4 py-2 text-left">Quantity</th>
                  <th className="px-4 py-2 text-left">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {selectedOrder.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{item.productName}</td>
                    <td className="px-4 py-2">${item.price.toFixed(2)}</td>
                    <td className="px-4 py-2">{item.quantity}</td>
                    <td className="px-4 py-2 font-semibold">${item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Shipping Address</h2>
              {selectedOrder.shippingAddress ? (
                <div className="bg-gray-50 p-4 rounded">
                  <p>{selectedOrder.shippingAddress.fullName}</p>
                  <p>{selectedOrder.shippingAddress.address}</p>
                  <p>
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{' '}
                    {selectedOrder.shippingAddress.zipCode}
                  </p>
                  <p>{selectedOrder.shippingAddress.country}</p>
                </div>
              ) : (
                <p className="text-gray-500">No shipping address provided</p>
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Payment</h2>
              <p className="text-gray-600">{selectedOrder.paymentMethod || 'N/A'}</p>
              <div className="mt-4 text-2xl font-bold text-primary-600">
                Total: ${selectedOrder.total.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">My Orders</h1>
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <p className="text-gray-500 text-lg mb-4">You have no orders yet</p>
          <Link
            href="/"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">My Orders</h1>
      
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Order #{order.id}</h2>
                <p className="text-sm text-gray-600">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                {order.status.toUpperCase()}
              </span>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Items:</p>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {item.productName} x {item.quantity} = ${item.subtotal.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-xl font-bold text-primary-600">
                Total: ${order.total.toFixed(2)}
              </div>
              <Link
                href={`/orders?orderId=${order.id}`}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LoadingOrders() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<LoadingOrders />}>
      <OrdersContent />
    </Suspense>
  )
}
