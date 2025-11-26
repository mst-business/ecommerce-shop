'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { api, Product } from '@/lib/api-client'
import ProductCard from './ProductCard'

export default function ProductGrid() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })

  useEffect(() => {
    loadProducts()
  }, [searchParams])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const filters: any = {}
      
      const search = searchParams.get('search')
      const categoryId = searchParams.get('categoryId')
      const minPrice = searchParams.get('minPrice')
      const maxPrice = searchParams.get('maxPrice')
      const minRating = searchParams.get('minRating')
      const sortBy = searchParams.get('sortBy')
      const page = searchParams.get('page')

      if (search) filters.search = search
      if (categoryId) filters.categoryId = Number(categoryId)
      if (minPrice) filters.minPrice = Number(minPrice)
      if (maxPrice) filters.maxPrice = Number(maxPrice)
      if (minRating) filters.minRating = Number(minRating)
      if (sortBy) filters.sortBy = sortBy
      if (page) filters.page = Number(page)
      filters.limit = 12

      const data = await api.getProducts(filters)
      setProducts(data.data?.products || [])
      if (data.data?.pagination) {
        setPagination({
          page: data.data.pagination.page,
          totalPages: data.data.pagination.totalPages,
          total: data.data.pagination.total
        })
      }
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/?${params.toString()}`)
  }

  if (loading) {
    return (
      <div>
        <div className="h-6 w-48 skeleton mb-6 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              <div className="aspect-square skeleton" />
              <div className="p-4 space-y-3">
                <div className="h-4 skeleton w-24 rounded" />
                <div className="h-5 skeleton w-full rounded" />
                <div className="h-4 skeleton w-3/4 rounded" />
                <div className="h-6 skeleton w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
        <div className="w-24 h-24 mx-auto mb-6 bg-primary-50 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
        >
          Clear Filters
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-500">
          Showing <span className="font-semibold text-gray-700">{products.length}</span> of{' '}
          <span className="font-semibold text-gray-700">{pagination.total}</span> products
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          <button
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {[...Array(pagination.totalPages)].map((_, i) => {
            const pageNum = i + 1
            // Show first, last, current, and adjacent pages
            if (
              pageNum === 1 ||
              pageNum === pagination.totalPages ||
              Math.abs(pageNum - pagination.page) <= 1
            ) {
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`w-10 h-10 rounded-xl font-medium transition-colors ${
                    pagination.page === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            } else if (
              (pageNum === 2 && pagination.page > 3) ||
              (pageNum === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 2)
            ) {
              return <span key={pageNum} className="text-gray-400">...</span>
            }
            return null
          })}
          
          <button
            onClick={() => goToPage(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
