'use client'

import Link from 'next/link'
import { useCategories } from '@/lib/hooks'
import { getCategoryIcon, getCategoryGradient } from '@/lib/constants'

export default function CategoryList() {
  const { categories, loading } = useCategories()

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
          <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(index)} opacity-90 group-hover:opacity-100 transition-opacity`} />
          
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

