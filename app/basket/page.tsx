'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, Cart, CartItem } from '@/lib/api-client'

export default function BasketPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push('/login')
      return
    }
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      const data = await api.getCart()
      setCart(data.data)
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId)
      return
    }

    try {
      await api.updateCartItem(productId, quantity)
      await loadCart()
    } catch (error: any) {
      alert(error.message || 'Failed to update cart')
      await loadCart()
    }
  }

  const removeItem = async (productId: number) => {
    try {
      await api.removeFromCart(productId)
      await loadCart()
    } catch (error: any) {
      alert(error.message || 'Failed to remove item')
    }
  }

  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return

    try {
      await api.clearCart()
      await loadCart()
    } catch (error: any) {
      alert(error.message || 'Failed to clear cart')
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

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Shopping Cart</h1>
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
          <Link
            href="/"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Shopping Cart</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {cart.items.map((item) => (
              <tr key={item.productId}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image || '/placeholder.jpg'}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <span className="font-medium text-gray-800">{item.productName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">${item.price.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                    className="w-20 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </td>
                <td className="px-6 py-4 font-semibold text-gray-800">
                  ${item.subtotal.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <div>
            <strong>Total Items:</strong> {cart.itemCount}
          </div>
          <div className="text-2xl font-bold text-primary-600">
            Total: ${cart.total.toFixed(2)}
          </div>
        </div>
        
        <div className="px-6 py-4 bg-white flex gap-4">
          <button
            onClick={clearCart}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Clear Cart
          </button>
          <Link
            href="/checkout"
            className="flex-1 text-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  )
}




