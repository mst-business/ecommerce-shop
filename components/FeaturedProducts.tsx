'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, Product } from '@/lib/api-client'
import ProductCard from './ProductCard'

type FilterType = 'most-ordered' | 'top-rated' | 'newest' | 'none'

interface FeaturedProductsProps {
  title: string
  subtitle?: string
  filterType?: FilterType
  limit?: number
}

export default function FeaturedProducts({ 
  title, 
  subtitle,
  filterType = 'none',
  limit = 4 
}: FeaturedProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [filterType])

  const filterProducts = (products: Product[]): Product[] => {
    switch (filterType) {
      case 'most-ordered':
        return [...products].sort((a, b) => a.stock - b.stock)
      
      case 'top-rated':
        return [...products].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      
      case 'newest':
        return [...products].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA
        })
      
      default:
        return products
    }
  }

  const loadProducts = async () => {
    setLoading(true)
    try {
      const data = await api.getProducts({ limit: 20 })
      let allProducts = data.data?.products || []
      
      allProducts = filterProducts(allProducts)
      
      setProducts(allProducts.slice(0, limit))
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              <div className="aspect-square skeleton" />
              <div className="p-4 space-y-3">
                <div className="h-4 skeleton w-24" />
                <div className="h-5 skeleton w-full" />
                <div className="h-4 skeleton w-3/4" />
                <div className="h-6 skeleton w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <Link 
          href="/" 
          className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 group"
        >
          View All
          <svg 
            className="w-4 h-4 transition-transform group-hover:translate-x-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </div>
  )
}

