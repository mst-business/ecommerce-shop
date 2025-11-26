'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const slides = [
  {
    id: 1,
    title: 'Summer Collection',
    subtitle: 'Discover our new arrivals',
    description: 'Up to 40% off on selected items',
    cta: 'Shop Now',
    href: '/categories',
    bgGradient: 'from-primary-50 via-white to-accent-50',
    accent: 'primary',
  },
  {
    id: 2,
    title: 'Free Shipping',
    subtitle: 'On orders over $50',
    description: 'Get your favorites delivered for free',
    cta: 'Learn More',
    href: '/',
    bgGradient: 'from-accent-50 via-white to-primary-50',
    accent: 'accent',
  },
  {
    id: 3,
    title: 'New Arrivals',
    subtitle: 'Fresh styles just dropped',
    description: 'Be the first to get the latest products',
    cta: 'Explore',
    href: '/categories',
    bgGradient: 'from-emerald-50 via-white to-teal-50',
    accent: 'primary',
  },
]

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length)
        setIsAnimating(false)
      }, 300)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const slide = slides[currentSlide]

  return (
    <section className={`relative overflow-hidden bg-gradient-to-br ${slide.bgGradient} transition-all duration-500`}>
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/50 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container mx-auto px-4 py-16 md:py-24 relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div 
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft mb-6 transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
          >
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-600">{slide.subtitle}</span>
          </div>

          {/* Title */}
          <h1 
            className={`text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
            style={{ transitionDelay: '50ms' }}
          >
            {slide.title}
          </h1>

          {/* Description */}
          <p 
            className={`text-lg md:text-xl text-gray-600 mb-8 transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
            style={{ transitionDelay: '100ms' }}
          >
            {slide.description}
          </p>

          {/* CTA Buttons */}
          <div 
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
            style={{ transitionDelay: '150ms' }}
          >
            <Link
              href={slide.href}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              {slide.cta}
              <svg 
                className="w-5 h-5 transition-transform group-hover:translate-x-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-full font-semibold border border-gray-200 hover:border-primary-300 hover:text-primary-600 transition-all duration-300"
            >
              Browse Categories
            </Link>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="flex items-center justify-center gap-2 mt-12">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAnimating(true)
                setTimeout(() => {
                  setCurrentSlide(index)
                  setIsAnimating(false)
                }, 300)
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'w-8 bg-primary-600' 
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-8 border-t border-gray-200/50">
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">Free Shipping</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm font-medium">Secure Payment</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium">Easy Returns</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-sm font-medium">24/7 Support</span>
          </div>
        </div>
      </div>
    </section>
  )
}


