'use client'

import { useEffect, useState } from 'react'
import { api, Product } from '@/lib/api-client'
import ProductCard from './ProductCard'

type FilterType = 'most-ordered' | 'top-rated' | 'newest' | 'none'

interface FeaturedProductsProps {
  title: string
  filterType?: FilterType
  limit?: number
}

export default function FeaturedProducts({ 
  title, 
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
        // Sort by stock (lower stock = more popular assumption)
        // In a real app, you'd track order counts
        return [...products].sort((a, b) => a.stock - b.stock)
      
      case 'top-rated':
        // Sort by price (lower price = better value assumption)
        // In a real app, you'd have a rating field
        return [...products].sort((a, b) => a.price - b.price)
      
      case 'newest':
        // Sort by creation date (newest first)
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
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

