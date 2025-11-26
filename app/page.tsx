import { Suspense } from 'react'
import ProductGrid from '@/components/ProductGrid'
import SearchAndFilters from '@/components/SearchAndFilters'
import CategoryList from '@/components/CategoryList'
import FeaturedProducts from '@/components/FeaturedProducts'
import Hero from '@/components/Hero'

function ProductsSection() {
  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">All Products</h2>
          <p className="text-gray-500 mt-1">Browse our complete collection</p>
        </div>
      </div>
      <SearchAndFilters />
      <ProductGrid />
    </section>
  )
}

function LoadingProducts() {
  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">All Products</h2>
          <p className="text-gray-500 mt-1">Browse our complete collection</p>
        </div>
      </div>
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <div>
      {/* Hero Banner */}
      <Hero />

      <div className="container mx-auto px-4 py-12">
        {/* Category List */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Shop by Category</h2>
              <p className="text-gray-500 mt-1">Find what you&apos;re looking for</p>
            </div>
          </div>
          <CategoryList />
        </section>

        {/* Featured Products Sections */}
        <section className="mb-16">
          <FeaturedProducts 
            title="Trending Now" 
            subtitle="Most popular products this week"
            filterType="most-ordered"
            limit={4}
          />
        </section>

        <section className="mb-16">
          <FeaturedProducts 
            title="Top Rated" 
            subtitle="Loved by our customers"
            filterType="top-rated"
            limit={4}
          />
        </section>

        <section className="mb-16">
          <FeaturedProducts 
            title="Fresh Arrivals" 
            subtitle="Just landed in store"
            filterType="newest"
            limit={4}
          />
        </section>

        {/* All Products Section */}
        <Suspense fallback={<LoadingProducts />}>
          <ProductsSection />
        </Suspense>
      </div>
    </div>
  )
}
