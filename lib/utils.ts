/**
 * Shared utility functions for the e-commerce application
 */

/**
 * Build a query string from an object of parameters
 * Filters out undefined, null, and empty string values
 */
export function buildQueryString(params?: object): string {
  if (!params) return '';
  
  const entries = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '');
  
  if (entries.length === 0) return '';
  
  return '?' + new URLSearchParams(
    entries.map(([key, value]) => [key, String(value)])
  ).toString();
}

/**
 * Format a number as currency (USD)
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return new Date(dateString).toLocaleDateString('en-US', options || defaultOptions);
}

/**
 * Format a date with time
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Debounce a function call
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

/**
 * Clamp a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a random string ID
 */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

/**
 * Check if we're running on the client side
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Safely parse JSON with a fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Create a class name string from conditional classes
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

