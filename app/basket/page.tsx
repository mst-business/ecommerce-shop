'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/contexts/ToastContext'

export default function BasketPage() {
  const { cart, loading, updateQuantity, removeFromCart, clearCart } = useCart()
  const { showToast } = useToast()
  const [updating, setUpdating] = useState<number | null>(null)

  const handleUpdateQuantity = async (productId: number, quantity: number) => {
    if (quantity < 1) {
      handleRemoveItem(productId)
      return
    }

    setUpdating(productId)
    try {
      await updateQuantity(productId, quantity)
    } catch (error: any) {
      showToast(error.message || 'Failed to update cart', 'error')
    } finally {
      setUpdating(null)
    }
  }

  const handleRemoveItem = async (productId: number) => {
    setUpdating(productId)
    try {
      await removeFromCart(productId)
      showToast('Item removed from cart', 'success')
    } catch (error: any) {
      showToast(error.message || 'Failed to remove item', 'error')
    } finally {
      setUpdating(null)
    }
  }

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return

    try {
      await clearCart()
      showToast('Cart cleared', 'success')
    } catch (error: any) {
      showToast(error.message || 'Failed to clear cart', 'error')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="h-10 w-48 skeleton rounded-xl mb-8" />
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 py-6 border-b border-gray-100 last:border-0">
              <div className="w-24 h-24 skeleton rounded-xl" />
              <div className="flex-1 space-y-3">
                <div className="h-5 skeleton w-48 rounded" />
                <div className="h-4 skeleton w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-primary-50 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all hover:shadow-lg hover:shadow-primary-600/25"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-500 mt-1">{cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} in your cart</p>
        </div>
        <Link
          href="/"
          className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Continue Shopping
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item, index) => (
            <div 
              key={item.productId} 
              className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 flex flex-col md:flex-row gap-4 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Product Image */}
              <Link href={`/product/${item.productId}`} className="flex-shrink-0">
                <img
                  src={item.image || '/placeholder.jpg'}
                  alt={item.productName}
                  className="w-full md:w-28 h-32 md:h-28 object-cover rounded-xl hover:opacity-80 transition-opacity"
                />
              </Link>
              
              {/* Product Details */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <Link href={`/product/${item.productId}`}>
                    <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                      {item.productName}
                    </h3>
                  </Link>
                  <p className="text-lg font-bold text-gray-900 mt-1">${item.price.toFixed(2)}</p>
                </div>
                
                {/* Quantity & Actions */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                      disabled={updating === item.productId}
                      className="w-9 h-9 rounded-lg bg-surface-50 hover:bg-surface-100 flex items-center justify-center text-gray-600 disabled:opacity-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-10 text-center font-semibold text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                      disabled={updating === item.productId}
                      className="w-9 h-9 rounded-lg bg-surface-50 hover:bg-surface-100 flex items-center justify-center text-gray-600 disabled:opacity-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg text-gray-900">
                      ${item.subtotal.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      disabled={updating === item.productId}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {updating === item.productId ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Clear Cart */}
          <button
            onClick={handleClearCart}
            className="text-sm text-gray-500 hover:text-red-500 font-medium flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Cart
          </button>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4 pb-6 border-b border-gray-100">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({cart.itemCount} items)</span>
                <span className="font-medium text-gray-900">${cart.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="font-medium text-primary-600">Free</span>
              </div>
            </div>
            
            <div className="flex justify-between py-6 border-b border-gray-100">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-gray-900">${cart.total.toFixed(2)}</span>
            </div>
            
            <Link
              href="/checkout"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all hover:shadow-lg hover:shadow-primary-600/25"
            >
              Proceed to Checkout
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            
            {/* Security Badge */}
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure Checkout
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}




