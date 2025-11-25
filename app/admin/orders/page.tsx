'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, AdminOrder } from '@/lib/api-client'

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    cancelled: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[status] || statusStyles.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// Modal component
function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md'
}: { 
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full ${sizeClasses[size]} p-6`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

// Status update modal
function StatusUpdateModal({
  isOpen,
  onClose,
  order,
  onUpdate
}: {
  isOpen: boolean
  onClose: () => void
  order: AdminOrder | null
  onUpdate: (id: number, status: string) => void
}) {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (order) {
      setStatus(order.status)
    }
  }, [order])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return
    setLoading(true)
    await onUpdate(order.id, status)
    setLoading(false)
    onClose()
  }

  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Order Status">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <p className="text-slate-300 mb-4">
            Update status for <span className="font-semibold text-white">Order #{order?.id}</span>
          </p>
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Status
          </label>
          <div className="grid grid-cols-2 gap-3">
            {statuses.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-4 py-3 rounded-xl border text-left transition-all ${
                  status === s
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <StatusBadge status={s} />
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Order detail modal
function OrderDetailModal({
  isOpen,
  onClose,
  order
}: {
  isOpen: boolean
  onClose: () => void
  order: AdminOrder | null
}) {
  if (!order) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Order #${order.id}`} size="lg">
      <div className="space-y-6">
        {/* Order Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <p className="text-sm text-slate-400 mb-1">Customer</p>
            <p className="text-white font-medium">{order.user?.username || 'Unknown'}</p>
            <p className="text-sm text-slate-400">{order.user?.email || ''}</p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <p className="text-sm text-slate-400 mb-1">Order Date</p>
            <p className="text-white font-medium">
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-sm text-slate-400">
              {new Date(order.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Status & Payment */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <p className="text-sm text-slate-400 mb-2">Status</p>
            <StatusBadge status={order.status} />
          </div>
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <p className="text-sm text-slate-400 mb-1">Payment Method</p>
            <p className="text-white font-medium capitalize">
              {order.paymentMethod?.replace('_', ' ') || 'Credit Card'}
            </p>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && Object.keys(order.shippingAddress).length > 0 && (
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <p className="text-sm text-slate-400 mb-2">Shipping Address</p>
            <div className="text-white">
              {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
              {order.shippingAddress.city && (
                <p>
                  {order.shippingAddress.city}
                  {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                  {order.shippingAddress.zip && ` ${order.shippingAddress.zip}`}
                </p>
              )}
              {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div>
          <p className="text-sm text-slate-400 mb-3">Order Items ({order.items.length})</p>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {order.items.map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl"
              >
                <div>
                  <p className="text-white font-medium">{item.productName}</p>
                  <p className="text-sm text-slate-400">
                    ${item.price.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <p className="text-emerald-400 font-semibold">${item.subtotal.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <p className="text-lg font-medium text-white">Total</p>
          <p className="text-2xl font-bold text-emerald-400">${order.total.toFixed(2)}</p>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-3 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Modals
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [statusUpdateOrder, setStatusUpdateOrder] = useState<AdminOrder | null>(null)
  
  // Stats
  const [stats, setStats] = useState<{
    pending: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
  }>({ pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 })

  useEffect(() => {
    loadOrders()
    loadStats()
  }, [pagination.page, statusFilter])

  const loadStats = async () => {
    try {
      const res = await api.getAdminStats()
      setStats({
        pending: res.data.orders.byStatus.pending || 0,
        processing: res.data.orders.byStatus.processing || 0,
        shipped: res.data.orders.byStatus.shipped || 0,
        delivered: res.data.orders.byStatus.delivered || 0,
        cancelled: res.data.orders.byStatus.cancelled || 0,
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      const res = await api.getAdminOrders(params)
      setOrders(res.data.orders)
      setPagination((prev) => ({
        ...prev,
        total: res.data.pagination.total,
        totalPages: res.data.pagination.totalPages
      }))
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.updateOrderStatus(id, status)
      await loadOrders()
      await loadStats()
    } catch (error: any) {
      alert(error.message || 'Failed to update order status')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusFilters = [
    { value: 'all', label: 'All Orders', count: Object.values(stats).reduce((a, b) => a + b, 0) },
    { value: 'pending', label: 'Pending', count: stats.pending, color: 'amber' },
    { value: 'processing', label: 'Processing', count: stats.processing, color: 'blue' },
    { value: 'shipped', label: 'Shipped', count: stats.shipped, color: 'purple' },
    { value: 'delivered', label: 'Delivered', count: stats.delivered, color: 'emerald' },
    { value: 'cancelled', label: 'Cancelled', count: stats.cancelled, color: 'rose' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Orders</h1>
        <p className="text-slate-400 mt-1">Manage and track customer orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">{stats.pending}</p>
          <p className="text-sm text-slate-400 mt-1">Pending</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">{stats.processing}</p>
          <p className="text-sm text-slate-400 mt-1">Processing</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-400">{stats.shipped}</p>
          <p className="text-sm text-slate-400 mt-1">Shipped</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-emerald-400">{stats.delivered}</p>
          <p className="text-sm text-slate-400 mt-1">Delivered</p>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-rose-400">{stats.cancelled}</p>
          <p className="text-sm text-slate-400 mt-1">Cancelled</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                setStatusFilter(filter.value)
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                statusFilter === filter.value
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-transparent'
              }`}
            >
              {filter.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                statusFilter === filter.value ? 'bg-emerald-500/30' : 'bg-slate-600'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-slate-400 text-lg">No orders found</p>
            <p className="text-slate-500 text-sm mt-1">
              {statusFilter !== 'all' ? 'Try a different status filter' : 'Orders will appear here when customers make purchases'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Order</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Items</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-white font-medium hover:text-emerald-400 transition-colors"
                      >
                        #{order.id}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                          {order.user?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{order.user?.username || 'Unknown'}</p>
                          <p className="text-sm text-slate-400">{order.user?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white">{formatDate(order.createdAt)}</p>
                      <p className="text-sm text-slate-400">{formatTime(order.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-emerald-400 font-semibold">${order.total.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setStatusUpdateOrder(order)}
                          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Update Status"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-white">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <OrderDetailModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />

      <StatusUpdateModal
        isOpen={!!statusUpdateOrder}
        onClose={() => setStatusUpdateOrder(null)}
        order={statusUpdateOrder}
        onUpdate={handleUpdateStatus}
      />
    </div>
  )
}

