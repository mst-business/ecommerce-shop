'use client'

import { useEffect, useState } from 'react'
import { api, Category, Product } from '@/lib/api-client'

// Modal component
function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: { 
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode 
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

// Delete confirmation modal
function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  categoryName,
  loading,
  hasProducts
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  categoryName: string
  loading: boolean
  hasProducts: boolean
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Category">
      <div className="space-y-6">
        {hasProducts ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            <p className="text-rose-400">
              Cannot delete <span className="font-semibold">"{categoryName}"</span> because it has products. 
              Please reassign or delete the products first.
            </p>
          </div>
        ) : (
          <p className="text-slate-300">
            Are you sure you want to delete <span className="font-semibold text-white">"{categoryName}"</span>? 
            This action cannot be undone.
          </p>
        )}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          {!hasProducts && (
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

// Category form modal
function CategoryFormModal({
  isOpen,
  onClose,
  category,
  onSubmit
}: {
  isOpen: boolean
  onClose: () => void
  category: Category | null
  onSubmit: (data: Partial<Category>) => Promise<void>
}) {
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || ''
      })
    } else {
      setFormData({
        name: '',
        description: ''
      })
    }
  }, [category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={category ? 'Edit Category' : 'Add Category'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="Category name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            placeholder="Optional description"
          />
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : (category ? 'Update Category' : 'Create Category')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Category card with products preview
function CategoryCard({
  category,
  productCount,
  onEdit,
  onDelete,
  onViewProducts
}: {
  category: Category
  productCount: number
  onEdit: () => void
  onDelete: () => void
  onViewProducts: () => void
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{category.name}</h3>
            <p className="text-sm text-slate-400">ID: {category.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Edit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {category.description && (
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{category.description}</p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-700/50 rounded-lg text-sm text-slate-300">
            {productCount} {productCount === 1 ? 'product' : 'products'}
          </span>
        </div>
        <button
          onClick={onViewProducts}
          className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
        >
          View Products
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Products preview modal
function ProductsPreviewModal({
  isOpen,
  onClose,
  category,
  products
}: {
  isOpen: boolean
  onClose: () => void
  category: Category | null
  products: Product[]
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Products in ${category?.name || ''}`}>
      <div className="max-h-96 overflow-y-auto">
        {products.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-slate-400">No products in this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div 
                key={product.id}
                className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-xl"
              >
                <div className="w-12 h-12 rounded-lg bg-slate-700 overflow-hidden flex-shrink-0">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{product.name}</p>
                  <p className="text-sm text-slate-400">${product.price.toFixed(2)} • Stock: {product.stock}</p>
                </div>
                {product.active === false ? (
                  <span className="px-2 py-1 bg-slate-600/50 rounded text-xs text-slate-400">Inactive</span>
                ) : product.stock === 0 ? (
                  <span className="px-2 py-1 bg-rose-500/20 rounded text-xs text-rose-400">Out of Stock</span>
                ) : (
                  <span className="px-2 py-1 bg-emerald-500/20 rounded text-xs text-emerald-400">Active</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-700">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}

interface CategoryWithProducts extends Category {
  products?: Product[]
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<CategoryWithProducts[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modals
  const [categoryFormOpen, setCategoryFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [previewCategory, setPreviewCategory] = useState<CategoryWithProducts | null>(null)
  
  // Product counts
  const [productCounts, setProductCounts] = useState<Record<number, number>>({})

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const res = await api.getCategories()
      setCategories(res.data)
      
      // Load product counts for each category
      const counts: Record<number, number> = {}
      for (const cat of res.data) {
        try {
          const catRes = await api.getCategory(cat.id)
          counts[cat.id] = catRes.data.products?.length || 0
        } catch {
          counts[cat.id] = 0
        }
      }
      setProductCounts(counts)
    } catch (error) {
      console.error('Failed to load categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async (data: Partial<Category>) => {
    try {
      await api.createCategory(data)
      await loadCategories()
    } catch (error: any) {
      alert(error.message || 'Failed to create category')
      throw error
    }
  }

  const handleUpdateCategory = async (data: Partial<Category>) => {
    if (!editingCategory) return
    try {
      await api.updateCategory(editingCategory.id, data)
      await loadCategories()
    } catch (error: any) {
      alert(error.message || 'Failed to update category')
      throw error
    }
  }

  const handleDeleteCategory = async () => {
    if (!deleteCategory) return
    setDeleteLoading(true)
    try {
      await api.deleteCategory(deleteCategory.id)
      setDeleteCategory(null)
      await loadCategories()
    } catch (error: any) {
      alert(error.message || 'Failed to delete category')
    } finally {
      setDeleteLoading(false)
    }
  }

  const openEditModal = (category: Category) => {
    setEditingCategory(category)
    setCategoryFormOpen(true)
  }

  const openCreateModal = () => {
    setEditingCategory(null)
    setCategoryFormOpen(true)
  }

  const handleViewProducts = async (category: Category) => {
    try {
      const res = await api.getCategory(category.id)
      setPreviewCategory({ ...category, products: res.data.products })
    } catch (error) {
      console.error('Failed to load category products:', error)
    }
  }

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Categories</h1>
          <p className="text-slate-400 mt-1">Organize your products into categories</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl hover:from-emerald-400 hover:to-cyan-400 transition-all font-medium shadow-lg shadow-emerald-500/25"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{categories.length}</p>
              <p className="text-sm text-slate-400">Total Categories</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {Object.values(productCounts).reduce((a, b) => a + b, 0)}
              </p>
              <p className="text-sm text-slate-400">Total Products</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {categories.length > 0 
                  ? Math.round(Object.values(productCounts).reduce((a, b) => a + b, 0) / categories.length)
                  : 0}
              </p>
              <p className="text-sm text-slate-400">Avg Products/Category</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="text-slate-400 text-lg mb-2">No categories found</p>
          <p className="text-slate-500 text-sm mb-4">
            {searchTerm ? 'Try a different search term' : 'Create your first category to get started'}
          </p>
          {!searchTerm && (
            <button
              onClick={openCreateModal}
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Create a category →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              productCount={productCounts[category.id] || 0}
              onEdit={() => openEditModal(category)}
              onDelete={() => setDeleteCategory(category)}
              onViewProducts={() => handleViewProducts(category)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CategoryFormModal
        isOpen={categoryFormOpen}
        onClose={() => {
          setCategoryFormOpen(false)
          setEditingCategory(null)
        }}
        category={editingCategory}
        onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
      />

      <DeleteConfirmModal
        isOpen={!!deleteCategory}
        onClose={() => setDeleteCategory(null)}
        onConfirm={handleDeleteCategory}
        categoryName={deleteCategory?.name || ''}
        loading={deleteLoading}
        hasProducts={(productCounts[deleteCategory?.id || 0] || 0) > 0}
      />

      <ProductsPreviewModal
        isOpen={!!previewCategory}
        onClose={() => setPreviewCategory(null)}
        category={previewCategory}
        products={previewCategory?.products || []}
      />
    </div>
  )
}

