'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api, Product, Category } from '@/lib/api-client'

export default function ProductPage() {
  const params = useParams()
  const productId = Number(params.id)
  const [product, setProduct] = useState<Product | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadProduct()
  }, [productId])

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

  const handleAddToCart = async () => {
    if (!api.isAuthenticated()) {
      alert('Please login to add items to cart')
      window.location.href = '/login'
      return
    }

    setAdding(true)
    try {
      await api.addToCart(productId, quantity)
      alert(`${quantity} item(s) added to cart!`)
    } catch (error: any) {
      alert(error.message || 'Failed to add to cart')
    } finally {
      setAdding(false)
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
      <Link href="/" className="text-primary-600 hover:underline mb-4 inline-block">
        ← Back to Products
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <img
            src={product.image || '/placeholder.jpg'}
            alt={product.name}
            className="w-full rounded-lg shadow-md"
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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{product.name}</h1>
          <p className="text-3xl font-bold text-primary-600 mb-6">
            ${product.price.toFixed(2)}
          </p>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              <strong>Stock:</strong> {product.stock} available
            </p>
            {product.description && (
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
          >
            {adding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}




