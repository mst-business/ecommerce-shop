'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api, Category, Product } from '@/lib/api-client'

export default function CategoriesPage() {
  const searchParams = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
    // Check for categoryId in URL query params
    const categoryIdParam = searchParams.get('categoryId')
    if (categoryIdParam) {
      setSelectedCategory(parseInt(categoryIdParam, 10))
    }
  }, [searchParams])

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryProducts(selectedCategory)
    }
  }, [selectedCategory])

  const loadCategories = async () => {
    try {
      const data = await api.getCategories()
      setCategories(data.data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategoryProducts = async (categoryId: number) => {
    try {
      const data = await api.getProducts({ categoryId })
      setProducts(data.data?.products || [])
    } catch (error) {
      console.error('Error loading products:', error)
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

  return (
    <div className="container mx-auto px-4 py-8">

      

      {selectedCategory && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Products in {categories.find(c => c.id === selectedCategory)?.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`}>
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={product.image || '/placeholder.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      {product.name}
                    </h3>
                    <p className="text-xl font-bold text-primary-600">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}




