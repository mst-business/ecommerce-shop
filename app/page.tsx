import ProductGrid from '@/components/ProductGrid'
import SearchAndFilters from '@/components/SearchAndFilters'
import CategoryList from '@/components/CategoryList'
import FeaturedProducts from '@/components/FeaturedProducts'
import Hero from '@/components/Hero'

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
              <p className="text-gray-500 mt-1">Find what you're looking for</p>
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
      </div>
    </div>
  )
}
