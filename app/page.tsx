import ProductGrid from '@/components/ProductGrid'
import SearchAndFilters from '@/components/SearchAndFilters'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Welcome to Our Store
        </h1>
        <p className="text-gray-600">
          Discover amazing products at great prices
        </p>
      </div>
      
      <SearchAndFilters />
      <ProductGrid />
    </div>
  )
}




