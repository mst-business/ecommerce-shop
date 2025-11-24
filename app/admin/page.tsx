'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, Product, Category } from '@/lib/api-client'

export default function AdminPage() {
  const router = useRouter()
  const [section, setSection] = useState<'products' | 'categories' | 'orders'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  
  const loadData = async () => {
    setLoading(true)
    try {
      if (section === 'products') {
        const data = await api.getProducts()
        setProducts(data.data?.products || [])
      } else if (section === 'categories') {
        const data = await api.getCategories()
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push('/login')
      return
    }
    loadData()
  }, [section])



  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Admin Panel</h1>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setSection('products')}
          className={`px-6 py-2 rounded-lg font-semibold ${
            section === 'products'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Manage Products
        </button>
        <button
          onClick={() => setSection('categories')}
          className={`px-6 py-2 rounded-lg font-semibold ${
            section === 'categories'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Manage Categories
        </button>
        <button
          onClick={() => setSection('orders')}
          className={`px-6 py-2 rounded-lg font-semibold ${
            section === 'orders'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          View Orders
        </button>
      </div>

      {section === 'products' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Products</h2>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              Add Product
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4">{product.id}</td>
                  <td className="px-6 py-4 font-medium">{product.name}</td>
                  <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">{product.stock}</td>
                  <td className="px-6 py-4">
                    <button className="text-primary-600 hover:text-primary-800 mr-4">Edit</button>
                    <button className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section === 'categories' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Categories</h2>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              Add Category
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4">{category.id}</td>
                  <td className="px-6 py-4 font-medium">{category.name}</td>
                  <td className="px-6 py-4">{category.description || ''}</td>
                  <td className="px-6 py-4">
                    <button className="text-primary-600 hover:text-primary-800 mr-4">Edit</button>
                    <button className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section === 'orders' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600">
            Order management would require admin endpoints in the API. Currently, users can only see their own orders.
          </p>
        </div>
      )}
    </div>
  )
}




