/**
 * Application-wide constants
 */

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
} as const;

// Order status values
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// Order status colors for UI
export const ORDER_STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-700' },
  shipped: { bg: 'bg-purple-100', text: 'text-purple-700' },
  delivered: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
};

// Local storage keys
export const STORAGE_KEYS = {
  USER_ID: 'userId',
  TOKEN: 'token',
  USER: 'user',
  GUEST_CART: 'guest_cart',
} as const;

// API configuration
export const API_CONFIG = {
  DEFAULT_URL: 'http://localhost:3001/api',
  TIMEOUT: 30000, // 30 seconds
} as const;

// Product rating
export const RATING = {
  MIN: 1,
  MAX: 5,
  DEFAULT: 0,
} as const;

// Debounce delays (milliseconds)
export const DEBOUNCE = {
  SEARCH: 300,
  INPUT: 150,
  RESIZE: 100,
} as const;

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Animation durations (milliseconds)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Toast notification durations
export const TOAST_DURATION = {
  SHORT: 2000,
  NORMAL: 3000,
  LONG: 5000,
} as const;

// Sort options for products
export const SORT_OPTIONS = [
  { value: '', label: 'Newest First' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
] as const;

// Rating filter options
export const RATING_FILTER_OPTIONS = [
  { value: '', label: 'Any Rating' },
  { value: '4', label: '4+ Stars' },
  { value: '3', label: '3+ Stars' },
  { value: '2', label: '2+ Stars' },
] as const;

// Category icons mapping
export const CATEGORY_ICONS: Record<string, string> = {
  electronics: '📱',
  clothing: '👕',
  books: '📚',
  home: '🏠',
  sports: '⚽',
  toys: '🧸',
  beauty: '💄',
  food: '🍕',
  music: '🎵',
  games: '🎮',
  garden: '🌱',
  health: '💊',
  jewelry: '💎',
  shoes: '👟',
  watches: '⌚',
  bags: '👜',
  furniture: '🪑',
  automotive: '🚗',
  pet: '🐕',
  baby: '👶',
  default: '🏷️',
};

// Category gradient colors
export const CATEGORY_GRADIENTS = [
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-sky-400 to-blue-500',
  'from-rose-400 to-pink-500',
  'from-violet-400 to-purple-500',
  'from-lime-400 to-green-500',
] as const;

/**
 * Get category icon by name
 */
export function getCategoryIcon(name: string): string {
  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lowerName.includes(key)) return icon;
  }
  return CATEGORY_ICONS.default;
}

/**
 * Get category gradient by index
 */
export function getCategoryGradient(index: number): string {
  return CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];
}

