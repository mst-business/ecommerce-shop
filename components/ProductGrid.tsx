'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { api, Product } from '@/lib/api-client'
import ProductCard from './ProductCard'

export default function ProductGrid() {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p className="text-gray-500 text-lg mb-2">No products found</p>
        <p className="text-gray-400 text-sm">Try adjusting your filters or search terms</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          Showing <span className="font-semibold">{products.length}</span> of <span className="font-semibold">{pagination.total}</span> products
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
