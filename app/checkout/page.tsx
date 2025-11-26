'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { guestCart } from '@/lib/guest-cart'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/contexts/ToastContext'
import { validators, validateForm } from '@/lib/validation'
import { FormField, Input, Select } from '@/components/ui/FormField'
import { LoadingButton } from '@/components/ui/LoadingButton'

export default function CheckoutPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { cart, loading, clearCart } = useCart()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    paymentMethod: 'credit_card',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Pre-fill form if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || ''
      }))
    }
  }, [isAuthenticated, user])

  // Redirect if cart is empty
  useEffect(() => {
    if (!loading && (!cart || cart.items.length === 0)) {
      router.push('/basket')
    }
  }, [cart, loading, router])

  const handleChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [errors])

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    
    // Validate single field on blur
    const validationRules: Record<string, (value: string) => string | null> = {
      fullName: (v) => validators.required(v, 'Full name') || validators.minLength(v, 2, 'Full name'),
      email: validators.email,
      phone: (v) => validators.phone(v, false),
      address: (v) => validators.required(v, 'Address'),
      city: (v) => validators.required(v, 'City'),
      state: (v) => validators.required(v, 'State'),
      zipCode: validators.zipCode,
    }
    
    const validator = validationRules[field]
    if (validator) {
      const error = validator(formData[field as keyof typeof formData])
      if (error) {
        setErrors(prev => ({ ...prev, [field]: error }))
      }
    }
  }, [formData])

  const validateAllFields = (): boolean => {
    const rules: Record<string, (v: unknown) => string | null> = {
      fullName: (v) => validators.required(v as string, 'Full name') || validators.minLength(v as string, 2, 'Full name'),
      address: (v) => validators.required(v as string, 'Address'),
      city: (v) => validators.required(v as string, 'City'),
      state: (v) => validators.required(v as string, 'State'),
      zipCode: (v) => validators.zipCode(v as string),
    }

    // Add email validation for guests
    if (!isAuthenticated) {
      rules.email = (v) => validators.email(v as string)
      rules.phone = (v) => validators.phone(v as string, false)
    }

    const { isValid, errors: validationErrors } = validateForm(formData, rules)
    
    if (!isValid) {
      setErrors(validationErrors)
      // Mark all fields as touched
      const allTouched: Record<string, boolean> = {}
      Object.keys(rules).forEach(key => { allTouched[key] = true })
      setTouched(prev => ({ ...prev, ...allTouched }))
    }
    
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cart) return

    // Validate all fields
    if (!validateAllFields()) {
      showToast('Please fix the errors in the form', 'error')
      return
    }

    setSubmitting(true)
    try {
      if (isAuthenticated) {
        // Authenticated user order
        const orderData = {
          items: cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shippingAddress: {
            fullName: formData.fullName,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
          },
          paymentMethod: formData.paymentMethod,
        }

        const result = await api.createOrder(orderData)
        await clearCart()
        showToast('Order placed successfully!', 'success')
        router.push(`/orders?orderId=${result.data.id}`)
      } else {
        // Guest order
        const guestOrderData = {
          items: cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shippingAddress: {
            fullName: formData.fullName,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
          },
          guestEmail: formData.email,
          guestPhone: formData.phone,
          paymentMethod: formData.paymentMethod,
        }

        const result = await api.createGuestOrder(guestOrderData)
        // Clear guest cart after successful order
        guestCart.clearCart()
        // Store order info for tracking
        localStorage.setItem('lastGuestOrder', JSON.stringify({
          orderId: result.data.id,
          email: formData.email
        }))
        showToast('Order placed successfully!', 'success')
        router.push(`/order-confirmation?orderId=${result.data.id}&email=${encodeURIComponent(formData.email)}`)
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to place order', 'error')
    } finally {
      setSubmitting(false)
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

  if (!cart) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          {!isAuthenticated && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-blue-800 font-medium">Checking out as guest</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Already have an account?{' '}
                    <Link href="/login" className="underline font-medium">Log in</Link>
                    {' '}for faster checkout and order tracking.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {isAuthenticated ? 'Shipping Information' : 'Contact & Shipping Information'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contact Info for Guests */}
            {!isAuthenticated && (
              <>
                <FormField
                  label="Email Address"
                  required
                  error={errors.email}
                  touched={touched.email}
                  hint="We'll send your order confirmation here"
                >
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="your@email.com"
                    error={!!errors.email && touched.email}
                  />
                </FormField>
                
                <FormField
                  label="Phone Number"
                  error={errors.phone}
                  touched={touched.phone}
                  hint="Optional - for delivery updates"
                >
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    onBlur={() => handleBlur('phone')}
                    placeholder="+1 (555) 000-0000"
                    error={!!errors.phone && touched.phone}
                  />
                </FormField>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="font-medium text-gray-800 mb-4">Shipping Address</h3>
                </div>
              </>
            )}
            
            <FormField
              label="Full Name"
              required
              error={errors.fullName}
              touched={touched.fullName}
            >
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                onBlur={() => handleBlur('fullName')}
                placeholder="John Doe"
                error={!!errors.fullName && touched.fullName}
              />
            </FormField>
            
            <FormField
              label="Address"
              required
              error={errors.address}
              touched={touched.address}
            >
              <Input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                onBlur={() => handleBlur('address')}
                placeholder="123 Main St, Apt 4"
                error={!!errors.address && touched.address}
              />
            </FormField>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="City"
                required
                error={errors.city}
                touched={touched.city}
              >
                <Input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  onBlur={() => handleBlur('city')}
                  placeholder="New York"
                  error={!!errors.city && touched.city}
                />
              </FormField>
              
              <FormField
                label="State"
                required
                error={errors.state}
                touched={touched.state}
              >
                <Input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  onBlur={() => handleBlur('state')}
                  placeholder="NY"
                  error={!!errors.state && touched.state}
                />
              </FormField>
            </div>
            
            <FormField
              label="Zip Code"
              required
              error={errors.zipCode}
              touched={touched.zipCode}
            >
              <Input
                type="text"
                value={formData.zipCode}
                onChange={(e) => handleChange('zipCode', e.target.value)}
                onBlur={() => handleBlur('zipCode')}
                placeholder="10001"
                error={!!errors.zipCode && touched.zipCode}
              />
            </FormField>
            
            <FormField label="Payment Method">
              <Select
                value={formData.paymentMethod}
                onChange={(e) => handleChange('paymentMethod', e.target.value)}
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="paypal">PayPal</option>
                <option value="bank_transfer">Bank Transfer</option>
              </Select>
            </FormField>
            
            <LoadingButton
              type="submit"
              loading={submitting}
              loadingText="Placing Order..."
              fullWidth
              size="lg"
            >
              Place Order
            </LoadingButton>
          </form>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md h-fit">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>
          <div className="space-y-4 mb-6">
            {cart.items.map((item) => (
              <div key={item.productId} className="flex justify-between border-b pb-4">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-gray-600">x {item.quantity}</p>
                </div>
                <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-2xl font-bold text-primary-600">
              <span>Total:</span>
              <span>${cart.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
