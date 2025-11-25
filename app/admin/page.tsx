'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, AdminStats, AdminOrder } from '@/lib/api-client'

// Simple bar chart component
function BarChart({ data, maxValue }: { data: { label: string; value: number; color: string }[]; maxValue: number }) {
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <span className="text-sm text-slate-400 w-24 truncate">{item.label}</span>
          <div className="flex-1 h-8 bg-slate-700/50 rounded-lg overflow-hidden">
            <div
              className={`h-full ${item.color} transition-all duration-500 flex items-center justify-end pr-2`}
              style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
            >
              <span className="text-xs font-semibold text-white">{item.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Sales trend mini chart
function SalesTrendChart({ data }: { data: { _id: string; totalSales: number; orderCount: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500">
        No sales data available
      </div>
    )
  }

  const maxSales = Math.max(...data.map(d => d.totalSales))
  const chartHeight = 180

  return (
    <div className="relative h-48 flex items-end gap-1 px-2">
      {data.slice(-14).map((day, index) => {
        const height = maxSales > 0 ? (day.totalSales / maxSales) * chartHeight : 0
        const date = new Date(day._id)
        const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' })
        
        return (
          <div key={index} className="flex-1 flex flex-col items-center group relative">
            <div 
              className="w-full bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-t-sm transition-all duration-300 hover:from-emerald-400 hover:to-cyan-300 cursor-pointer"
              style={{ height: `${Math.max(height, 4)}px` }}
            />
            <span className="text-[10px] text-slate-500 mt-1">{dayLabel}</span>
            
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <div className="font-semibold">${day.totalSales.toFixed(2)}</div>
              <div className="text-slate-400">{day.orderCount} orders</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Stat Card component
function StatCard({ 
  title, 
  value, 
  icon, 
  change, 
  color = 'emerald' 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  change?: string;
  color?: 'emerald' | 'cyan' | 'amber' | 'rose'
}) {
  const colorClasses = {
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400',
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-6 backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {change && (
            <p className="text-sm text-emerald-400 mt-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-slate-800/50 ${colorClasses[color].split(' ').pop()}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// Order status badge
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.getAdminStats(),
          api.getRecentOrders(5),
        ])
        setStats(statsRes.data)
        setRecentOrders(ordersRes.data)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
      </div>
    )
  }

  const orderStatusData = stats?.orders.byStatus || {}
  const statusChartData = [
    { label: 'Pending', value: orderStatusData.pending || 0, color: 'bg-amber-500' },
    { label: 'Processing', value: orderStatusData.processing || 0, color: 'bg-blue-500' },
    { label: 'Shipped', value: orderStatusData.shipped || 0, color: 'bg-purple-500' },
    { label: 'Delivered', value: orderStatusData.delivered || 0, color: 'bg-emerald-500' },
    { label: 'Cancelled', value: orderStatusData.cancelled || 0, color: 'bg-rose-500' },
  ]
  const maxStatusCount = Math.max(...statusChartData.map(d => d.value), 1)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales"
          value={`$${(stats?.sales.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          color="emerald"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Total Orders"
          value={stats?.orders.total || 0}
          color="cyan"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />
        <StatCard
          title="Customers"
          value={stats?.users || 0}
          color="amber"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          title="Active Products"
          value={stats?.products.active || 0}
          color="rose"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Sales Trend</h2>
              <p className="text-sm text-slate-400">Last 14 days</p>
            </div>
            <Link 
              href="/admin/orders" 
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View All →
            </Link>
          </div>
          <SalesTrendChart data={stats?.sales.byDay || []} />
        </div>

        {/* Order Status Distribution */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Order Status</h2>
              <p className="text-sm text-slate-400">Distribution by status</p>
            </div>
          </div>
          <BarChart data={statusChartData} maxValue={maxStatusCount} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
              <p className="text-sm text-slate-400">Latest 5 orders</p>
            </div>
            <Link 
              href="/admin/orders" 
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No orders yet</p>
            ) : (
              recentOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                      {order.user?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-white font-medium">Order #{order.id}</p>
                      <p className="text-sm text-slate-400">{order.user?.username || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">${order.total.toFixed(2)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Top Products</h2>
              <p className="text-sm text-slate-400">Best sellers by quantity</p>
            </div>
            <Link 
              href="/admin/products" 
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            {!stats?.topProducts || stats.topProducts.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No product sales yet</p>
            ) : (
              stats.topProducts.map((product, index) => (
                <div 
                  key={product._id} 
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-amber-500 text-slate-900' :
                      index === 1 ? 'bg-slate-400 text-slate-900' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-slate-600 text-slate-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium line-clamp-1">{product.productName}</p>
                      <p className="text-sm text-slate-400">{product.totalQuantity} sold</p>
                    </div>
                  </div>
                  <p className="text-emerald-400 font-semibold">${product.totalRevenue.toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Product Inventory</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-slate-700/30 rounded-xl">
            <p className="text-3xl font-bold text-white">{stats?.products.total || 0}</p>
            <p className="text-slate-400 mt-1">Total Products</p>
          </div>
          <div className="text-center p-4 bg-slate-700/30 rounded-xl">
            <p className="text-3xl font-bold text-emerald-400">{stats?.products.active || 0}</p>
            <p className="text-slate-400 mt-1">Active & In Stock</p>
          </div>
          <div className="text-center p-4 bg-slate-700/30 rounded-xl">
            <p className="text-3xl font-bold text-rose-400">{stats?.products.outOfStock || 0}</p>
            <p className="text-slate-400 mt-1">Out of Stock</p>
          </div>
        </div>
      </div>
    </div>
  )
}
