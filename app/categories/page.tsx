'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, Category, Product } from '@/lib/api-client'
import SearchAndFilters from '@/components/SearchAndFilters'
import ProductCard from '@/components/ProductCard'

// Category icons mapping
const categoryIcons: Record<string, string> = {
  electronics: '📱',
  clothing: '👕',
  books: '📚',
  home: '🏠',
  sports: '⚽',
  toys: '🧸',
  beauty: '💄',
  food: '🍔',
  default: '📦'
}

function getCategoryIcon(name: string): string {
  const lowercaseName = name.toLowerCase()
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (lowercaseName.includes(key)) return icon
  }
  return categoryIcons.default
}

export default function CategoriesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    // Check for categoryId in URL query params
    const categoryIdParam = searchParams.get('categoryId')
    if (categoryIdParam) {
      setSelectedCategory(parseInt(categoryIdParam, 10))
    } else {
      setSelectedCategory(null)
      setProducts([])
    }
  }, [searchParams])

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryProducts()
    }
  }, [selectedCategory, searchParams])

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

  const loadCategoryProducts = async () => {
    if (!selectedCategory) return
    
    setProductsLoading(true)
    try {
      const filters: any = { categoryId: selectedCategory }
      
      // Get additional filters from URL
      const search = searchParams.get('search')
      const minPrice = searchParams.get('minPrice')
      const maxPrice = searchParams.get('maxPrice')
      const minRating = searchParams.get('minRating')
      const sortBy = searchParams.get('sortBy')
      
      if (search) filters.search = search
      if (minPrice) filters.minPrice = Number(minPrice)
      if (maxPrice) filters.maxPrice = Number(maxPrice)
      if (minRating) filters.minRating = Number(minRating)
      if (sortBy) filters.sortBy = sortBy
      
      const data = await api.getProducts(filters)
      setProducts(data.data?.products || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setProductsLoading(false)
    }
  }

  const handleCategorySelect = (categoryId: number) => {
    router.push(`/categories?categoryId=${categoryId}`)
  }

  const selectedCategoryData = categories.find(c => c.id === selectedCategory)

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
      {/* Page Header */}
      <div className="mb-8">
        {selectedCategory && (
          <Link 
            href="/categories"
            className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Categories
          </Link>
        )}
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          {selectedCategory ? selectedCategoryData?.name : 'Browse Categories'}
        </h1>
        <p className="text-gray-600">
          {selectedCategory 
            ? `Explore products in ${selectedCategoryData?.name}`
            : 'Find products by category'
          }
        </p>
      </div>

      {/* Category Cards - Only when no category selected */}
      {!selectedCategory && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">All Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className="p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-primary-300 transition-all text-center hover:shadow-lg"
              >
                <div className="text-3xl mb-2">{getCategoryIcon(category.name)}</div>
                <h3 className="font-medium text-gray-800">{category.name}</h3>
                {category.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {category.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products Section - Only when category is selected */}
      {selectedCategory && (
        <div>
          {/* Search and Filters */}
          <SearchAndFilters />

          {/* Products Grid */}
          <div className="mt-6">
            {productsLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or browse other categories
                </p>
                <Link
                  href="/categories"
                  className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Browse All Categories
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-600">
                    <span className="font-semibold text-gray-800">{products.length}</span> products found
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Empty state when no category selected */}
      {!selectedCategory && (
        <div className="text-center py-12 bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border border-primary-100">
          <div className="text-6xl mb-4">👆</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a Category</h3>
          <p className="text-gray-600">
            Click on any category above to browse products
          </p>
        </div>
      )}
    </div>
  )
}

