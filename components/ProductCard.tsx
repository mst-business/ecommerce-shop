'use client'

import Link from 'next/link'
import { Product } from '@/lib/api-client'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/contexts/ToastContext'
import { useState } from 'react'

interface ProductCardProps {
  product: Product
  index?: number
}

// Star Rating Display Component
function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= Math.round(rating) ? 'text-accent-400' : 'text-gray-200'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-gray-400 ml-1">({count})</span>
      )}
    </div>
  )
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const [adding, setAdding] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setAdding(true)
    try {
      await addToCart(product.id, 1, {
        name: product.name,
        price: product.price,
        image: product.image,
      })
      showToast(`${product.name} added to cart!`, 'success')
    } catch (error: any) {
      showToast(error.message || 'Failed to add to cart', 'error')
    } finally {
      setAdding(false)
    }
  }

  const isOutOfStock = product.stock === 0
  const isLowStock = product.stock > 0 && product.stock <= 5

  return (
    <Link href={`/product/${product.id}`}>
      <div 
        className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-primary-200 hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Image Container */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {/* Skeleton loader */}
          {!imageLoaded && (
            <div className="absolute inset-0 skeleton" />
          )}
          
          <img
            src={product.image || '/placeholder.jpg'}
            alt={product.name}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } ${isOutOfStock ? 'grayscale' : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22sans-serif%22 font-size=%2216%22 dy=%2210.5%22 font-weight=%22500%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E'
              setImageLoaded(true)
            }}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isOutOfStock && (
              <span className="badge badge-error">
                Out of Stock
              </span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="badge badge-warning">
                Only {product.stock} left
              </span>
            )}
            {product.averageRating && product.averageRating >= 4.5 && (
              <span className="badge badge-accent">
                ⭐ Top Rated
              </span>
            )}
          </div>

          {/* Quick Add Button */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleAddToCart}
              disabled={adding || isOutOfStock}
              className="w-full py-2.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-primary-50 disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              {adding ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Adding...
                </>
              ) : isOutOfStock ? (
                'Out of Stock'
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Quick Add
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Rating */}
          <div className="mb-2">
            {(product.ratingCount || 0) > 0 ? (
              <StarRating rating={product.averageRating || 0} count={product.ratingCount} />
            ) : (
              <span className="text-xs text-gray-400">No reviews yet</span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
            </div>
            
            {/* Stock indicator */}
            {!isOutOfStock && !isLowStock && (
              <span className="text-xs text-primary-600 font-medium">
                In Stock
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
