'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { api, Category } from '@/lib/api-client'

export default function SearchAndFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isExpanded, setIsExpanded] = useState(false)
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | ''>(
    searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : ''
  )
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || '')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await api.getCategories()
      setCategories(data.data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (selectedCategory) params.set('categoryId', selectedCategory.toString())
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (minRating) params.set('minRating', minRating)
    if (sortBy) params.set('sortBy', sortBy)
    
    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setMinPrice('')
    setMaxPrice('')
    setMinRating('')
    setSortBy('')
    router.push(pathname)
  }

  const hasActiveFilters = search || selectedCategory || minPrice || maxPrice || minRating || sortBy
  const activeFilterCount = [search, selectedCategory, minPrice, maxPrice, minRating, sortBy].filter(Boolean).length

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-8">
      {/* Search Bar - Always Visible */}
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <svg 
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3 bg-surface-50 border-0 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value)
              setTimeout(applyFilters, 0)
            }}
            className="px-4 py-3 bg-surface-50 border-0 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
          >
            <option value="">Sort: Newest</option>
            <option value="rating">Highest Rated</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-colors ${
              isExpanded || hasActiveFilters
                ? 'bg-primary-600 text-white'
                : 'bg-surface-50 text-gray-700 hover:bg-surface-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-white text-primary-600 text-xs font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Search Button */}
          <button
            onClick={applyFilters}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            Search
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expandable Filters */}
      {isExpanded && (
        <div className="px-4 md:px-6 pb-6 border-t border-gray-100 pt-4 animate-fade-in-down">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2.5 bg-surface-50 border-0 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Min Rating
              </label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-50 border-0 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
              </select>
            </div>
            
            {/* Min Price */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Min Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full pl-8 pr-4 py-2.5 bg-surface-50 border-0 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
            
            {/* Max Price */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Max Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Any"
                  min="0"
                  className="w-full pl-8 pr-4 py-2.5 bg-surface-50 border-0 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-red-500 font-medium flex items-center gap-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
