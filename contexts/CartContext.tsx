'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { api, Cart } from '@/lib/api-client'
import { guestCart, GuestCart } from '@/lib/guest-cart'

interface CartContextType {
  cart: Cart | GuestCart | null
  cartCount: number
  loading: boolean
  refreshCart: () => Promise<void>
  addToCart: (productId: number, quantity: number, product?: { name: string; price: number; image?: string }) => Promise<boolean>
  updateQuantity: (productId: number, quantity: number) => Promise<void>
  removeFromCart: (productId: number) => Promise<void>
  clearCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | GuestCart | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const refreshCart = useCallback(async () => {
    try {
      if (api.isAuthenticated()) {
        const data = await api.getCart()
        setCart(data.data)
        setCartCount(data.data?.itemCount || 0)
      } else {
        const localCart = guestCart.getCart()
        setCart(localCart)
        setCartCount(localCart.itemCount || 0)
      }
    } catch (error) {
      console.error('Failed to refresh cart:', error)
      setCartCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load and listen for guest cart updates
  useEffect(() => {
    refreshCart()

    // Listen for guest cart updates (from guestCart utility)
    const handleGuestCartUpdate = (e: CustomEvent<GuestCart>) => {
      if (!api.isAuthenticated()) {
        setCart(e.detail)
        setCartCount(e.detail.itemCount || 0)
      }
    }

    window.addEventListener('guestCartUpdated', handleGuestCartUpdate as EventListener)
    return () => {
      window.removeEventListener('guestCartUpdated', handleGuestCartUpdate as EventListener)
    }
  }, [refreshCart])

  const addToCart = useCallback(async (
    productId: number, 
    quantity: number,
    product?: { name: string; price: number; image?: string }
  ): Promise<boolean> => {
    try {
      if (api.isAuthenticated()) {
        await api.addToCart(productId, quantity)
        await refreshCart()
      } else {
        if (!product) {
          throw new Error('Product info required for guest cart')
        }
        guestCart.addItem(
          { id: productId, name: product.name, price: product.price, image: product.image },
          quantity
        )
        // Guest cart will dispatch event, triggering refresh
      }
      return true
    } catch (error) {
      console.error('Failed to add to cart:', error)
      throw error
    }
  }, [refreshCart])

  const updateQuantity = useCallback(async (productId: number, quantity: number) => {
    try {
      if (api.isAuthenticated()) {
        if (quantity <= 0) {
          await api.removeFromCart(productId)
        } else {
          await api.updateCartItem(productId, quantity)
        }
        await refreshCart()
      } else {
        guestCart.updateItemQuantity(productId, quantity)
        // Guest cart will dispatch event
      }
    } catch (error) {
      console.error('Failed to update quantity:', error)
      throw error
    }
  }, [refreshCart])

  const removeFromCart = useCallback(async (productId: number) => {
    try {
      if (api.isAuthenticated()) {
        await api.removeFromCart(productId)
        await refreshCart()
      } else {
        guestCart.removeItem(productId)
        // Guest cart will dispatch event
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error)
      throw error
    }
  }, [refreshCart])

  const clearCart = useCallback(async () => {
    try {
      if (api.isAuthenticated()) {
        await api.clearCart()
        await refreshCart()
      } else {
        guestCart.clearCart()
        setCart({ items: [], total: 0, itemCount: 0 })
        setCartCount(0)
      }
    } catch (error) {
      console.error('Failed to clear cart:', error)
      throw error
    }
  }, [refreshCart])

  return (
    <CartContext.Provider value={{
      cart,
      cartCount,
      loading,
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

