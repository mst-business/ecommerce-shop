import ProductGrid from '@/components/ProductGrid'
import SearchAndFilters from '@/components/SearchAndFilters'
import CategoryList from '@/components/CategoryList'
import FeaturedProducts from '@/components/FeaturedProducts'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">

      {/* Category List */}
      <CategoryList />

      {/* Featured Products Sections */}
      <FeaturedProducts 
        title="🔥 Most Ordered Products" 
        filterType="most-ordered"
        limit={4}
      />

      <FeaturedProducts 
        title="⭐ Top Rated Products" 
        filterType="top-rated"
        limit={4}
      />

      <FeaturedProducts 
        title="🆕 Newest Arrivals" 
        filterType="newest"
        limit={4}
      />

      {/* Search and All Products */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">All Products</h2>
        <SearchAndFilters />
        <ProductGrid />
      </div>
    </div>
  )
}
