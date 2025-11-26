'use client'

import { ReactNode } from 'react'
import { CartProvider } from '@/contexts/CartContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </CartProvider>
  )
}

