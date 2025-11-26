'use client';

import { useState, useEffect } from 'react';
import { api, Category } from '@/lib/api-client';

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing categories
 */
export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err instanceof Error ? err : new Error('Failed to load categories'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}


