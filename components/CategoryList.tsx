'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, Category } from '@/lib/api-client'

// Category icons mapping
const categoryIcons: Record<string, string> = {
  'electronics': '📱',
  'clothing': '👕',
  'books': '📚',
  'home': '🏠',
  'sports': '⚽',
  'toys': '🧸',
  'beauty': '💄',
  'food': '🍕',
  'music': '🎵',
  'games': '🎮',
  'garden': '🌱',
  'health': '💊',
  'jewelry': '💎',
  'shoes': '👟',
  'watches': '⌚',
  'bags': '👜',
  'furniture': '🪑',
  'automotive': '🚗',
  'pet': '🐕',
  'baby': '👶',
}

function getCategoryIcon(name: string): string {
  const lowerName = name.toLowerCase()
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (lowerName.includes(key)) return icon
  }
  return '🏷️'
}

// Gradient colors for category cards
const gradients = [
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-sky-400 to-blue-500',
  'from-rose-400 to-pink-500',
  'from-violet-400 to-purple-500',
  'from-lime-400 to-green-500',
]

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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl skeleton" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {categories.map((category, index) => (
        <Link
          key={category.id}
          href={`/categories?categoryId=${category.id}`}
          className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Background Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index % gradients.length]} opacity-90 group-hover:opacity-100 transition-opacity`} />
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center text-white">
            <span className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">
              {getCategoryIcon(category.name)}
            </span>
            <h3 className="font-semibold text-sm">
              {category.name}
            </h3>
          </div>

          {/* Decorative circle */}
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
        </Link>
      ))}
      
      {/* View All Card */}
      <Link
        href="/categories"
        className="group relative overflow-hidden rounded-2xl p-5 bg-gray-100 hover:bg-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg flex flex-col items-center justify-center"
      >
        <div className="w-12 h-12 rounded-full bg-gray-200 group-hover:bg-gray-300 flex items-center justify-center mb-3 transition-colors">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
        <span className="font-semibold text-sm text-gray-700">View All</span>
      </Link>
    </div>
  )
}

