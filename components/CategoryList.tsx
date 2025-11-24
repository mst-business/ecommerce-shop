'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, Category } from '@/lib/api-client'

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

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

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Shop by Category</h2>
      <div className="flex flex-wrap gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories?categoryId=${category.id}`}
            className="bg-white px-6 py-3 rounded-lg shadow-md hover:shadow-xl transition-shadow border-2 border-transparent hover:border-primary-600"
          >
            <span className="text-gray-800 font-semibold">{category.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

