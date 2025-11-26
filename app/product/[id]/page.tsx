'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api, Product, Category, Rating } from '@/lib/api-client'
import { useToast } from '@/contexts/ToastContext'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'

// Interactive Star Rating Component
function StarRatingInput({ 
  value, 
  onChange, 
  size = 'lg',
  readonly = false 
}: { 
  value: number
  onChange?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
}) {
  const [hoverRating, setHoverRating] = useState(0)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <svg
            className={`${sizeClasses[size]} ${
              star <= (hoverRating || value) ? 'text-yellow-400' : 'text-gray-300'
            } transition-colors`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

// Rating Form Component
function RatingForm({ 
  productId, 
  existingRating,
  onSubmit 
}: { 
  productId: number
  existingRating: Rating | null
  onSubmit: () => void
}) {
  const [rating, setRating] = useState(existingRating?.rating || 0)
  const [review, setReview] = useState(existingRating?.review || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setLoading(true)
    setError('')
    try {
      await api.addRating(productId, rating, review)
      onSubmit()
    } catch (err: any) {
      setError(err.message || 'Failed to submit rating')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your review?')) return
    
    setLoading(true)
    try {
      await api.deleteRating(productId)
      setRating(0)
      setReview('')
      onSubmit()
    } catch (err: any) {
      setError(err.message || 'Failed to delete rating')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-xl">
      <h4 className="font-semibold text-gray-800 mb-4">
        {existingRating ? 'Update Your Review' : 'Write a Review'}
      </h4>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Review (optional)
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your thoughts about this product..."
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">{review.length}/1000 characters</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || rating === 0}
          className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Submitting...' : existingRating ? 'Update Review' : 'Submit Review'}
        </button>
        {existingRating && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  )
}

// Review Item Component
function ReviewItem({ rating }: { rating: Rating }) {
  return (
    <div className="border-b border-gray-100 pb-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800">{rating.user?.name || 'Anonymous'}</span>
            <StarRatingInput value={rating.rating} readonly size="sm" />
          </div>
          <p className="text-xs text-gray-500">
            {rating.createdAt && new Date(rating.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
      {rating.review && (
        <p className="text-gray-700 mt-2">{rating.review}</p>
      )}
    </div>
  )
}

export default function ProductPage() {
  const params = useParams()
  const productId = Number(params.id)
  const { showToast } = useToast()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  
  // Rating states
  const [ratings, setRatings] = useState<Rating[]>([])
  const [myRating, setMyRating] = useState<Rating | null>(null)
  const [ratingSummary, setRatingSummary] = useState({ averageRating: 0, ratingCount: 0 })
  const [loadingRatings, setLoadingRatings] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)

  useEffect(() => {
    loadProduct()
    loadRatings()
    if (isAuthenticated) {
      loadMyRating()
    }
  }, [productId, isAuthenticated])

  const loadProduct = async () => {
    try {
      const data = await api.getProduct(productId)
      setProduct(data.data)
      
      if (data.data.categoryId) {
        const catData = await api.getCategories()
        const foundCategory = catData.data.find(c => c.id === data.data.categoryId)
        if (foundCategory) setCategory(foundCategory)
      }
    } catch (error) {
      console.error('Error loading product:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRatings = async () => {
    setLoadingRatings(true)
    try {
      const data = await api.getProductRatings(productId, { limit: 5 })
      setRatings(data.data.ratings)
      setRatingSummary(data.data.summary)
    } catch (error) {
      console.error('Error loading ratings:', error)
    } finally {
      setLoadingRatings(false)
    }
  }

  const loadMyRating = async () => {
    try {
      const data = await api.getMyRating(productId)
      setMyRating(data.data)
    } catch (error) {
      console.error('Error loading my rating:', error)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return
    
    setAdding(true)
    try {
      await addToCart(productId, quantity, {
        name: product.name,
        price: product.price,
        image: product.image
      })
      showToast(`${quantity} item(s) added to cart!`, 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to add to cart', 'error')
    } finally {
      setAdding(false)
    }
  }

  const handleRatingSubmit = () => {
    loadProduct()
    loadRatings()
    loadMyRating()
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

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">Product not found</p>
          <Link href="/" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="text-primary-600 hover:underline mb-4 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Products
      </Link>
      
      {/* Product Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white p-8 rounded-2xl shadow-lg mt-4">
        <div>
          <img
            src={product.image || '/placeholder.jpg'}
            alt={product.name}
            className="w-full rounded-xl shadow-md"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect fill=%22%23ddd%22 width=%22400%22 height=%22400%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2224%22 dy=%2210.5%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E'
            }}
          />
        </div>
        
        <div>
          {category && (
            <span className="inline-block bg-primary-100 text-primary-800 text-sm px-3 py-1 rounded-full mb-4">
              {category.name}
            </span>
          )}
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{product.name}</h1>
          
          {/* Rating Display */}
          <div className="flex items-center gap-3 mb-4">
            <StarRatingInput value={ratingSummary.averageRating} readonly size="md" />
            <span className="text-lg font-semibold text-gray-700">
              {ratingSummary.averageRating.toFixed(1)}
            </span>
            <span className="text-gray-500">
              ({ratingSummary.ratingCount} {ratingSummary.ratingCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>

          <p className="text-3xl font-bold text-primary-600 mb-6">
            ${product.price.toFixed(2)}
          </p>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              <strong>Stock:</strong>{' '}
              <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
              </span>
            </p>
            {product.description && (
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            )}
          </div>
          
          {product.stock > 0 && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(Number(e.target.value), product.stock))}
                  className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="w-full bg-primary-600 text-white py-4 rounded-xl hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
              >
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Reviews</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rating Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-6 rounded-xl text-center">
              <div className="text-5xl font-bold text-gray-800 mb-2">
                {ratingSummary.averageRating.toFixed(1)}
              </div>
              <StarRatingInput value={ratingSummary.averageRating} readonly size="lg" />
              <p className="text-gray-500 mt-2">
                Based on {ratingSummary.ratingCount} {ratingSummary.ratingCount === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Rating Form - Only for authenticated users */}
            {isAuthenticated ? (
              <div className="mt-6">
                <RatingForm 
                  productId={productId} 
                  existingRating={myRating}
                  onSubmit={handleRatingSubmit}
                />
              </div>
            ) : (
              <div className="mt-6 bg-gray-50 p-6 rounded-xl text-center">
                <p className="text-gray-600 mb-4">Please login to write a review</p>
                <Link
                  href="/login"
                  className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Login
                </Link>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2">
            {loadingRatings ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : ratings.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(showAllReviews ? ratings : ratings.slice(0, 3)).map((rating) => (
                  <ReviewItem key={rating.id} rating={rating} />
                ))}
                
                {ratings.length > 3 && (
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {showAllReviews ? 'Show Less' : `Show All ${ratings.length} Reviews`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
