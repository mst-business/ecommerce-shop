'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, Product, Pagination } from '@/lib/api-client';
import { PAGINATION } from '@/lib/constants';

interface ProductFilters {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  minRating?: number;
  sortBy?: 'newest' | 'rating' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

interface UseProductsReturn {
  products: Product[];
  pagination: Pagination;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setFilters: (filters: ProductFilters) => void;
}

/**
 * Custom hook for fetching and managing products with filters
 */
export function useProducts(initialFilters?: ProductFilters): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: PAGINATION.DEFAULT_PAGE,
    limit: PAGINATION.DEFAULT_LIMIT,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFiltersState] = useState<ProductFilters>(initialFilters || {});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getProducts({
        ...filters,
        limit: filters.limit || PAGINATION.DEFAULT_LIMIT,
      });
      
      setProducts(response.data?.products || []);
      if (response.data?.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err instanceof Error ? err : new Error('Failed to load products'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const setFilters = useCallback((newFilters: ProductFilters) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    products,
    pagination,
    loading,
    error,
    refetch: fetchProducts,
    setFilters,
  };
}


