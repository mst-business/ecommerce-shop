'use client'

import Link from 'next/link'
import { Product } from '@/lib/api-client'
import { useCart } from '@/contexts/CartContext'
import { useState } from 'react'

interface ProductCardProps {
  product: Product
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
              star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-gray-500">({count})</span>
      )}
    </div>
  )
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()
  const [adding, setAdding] = useState(false)
  const [showToast, setShowToast] = useState(false)

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
      // Show success toast
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } catch (error: any) {
      alert(error.message || 'Failed to add to cart')
    } finally {
      setAdding(false)
    }
  }

  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group relative">
        {/* Success Toast */}
        {showToast && (
          <div className="absolute top-2 left-2 right-2 z-20 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg animate-pulse">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Added to cart!
          </div>
        )}
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          <img
            src={product.image || '/placeholder.jpg'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23ddd%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2218%22 dy=%2210.5%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E'
            }}
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                Out of Stock
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
          
          {/* Rating Display */}
          <div className="mb-2">
            {(product.ratingCount || 0) > 0 ? (
              <StarRating rating={product.averageRating || 0} count={product.ratingCount} />
            ) : (
              <span className="text-xs text-gray-400">No reviews yet</span>
            )}
          </div>

          {product.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl font-bold text-primary-600">
              ${product.price.toFixed(2)}
            </span>
            {product.stock > 0 && product.stock <= 10 && (
              <span className="text-xs text-orange-500 font-medium">
                Only {product.stock} left
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {adding ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  )
}
