/**
 * API Client for E-commerce API
 */
import { buildQueryString, isClient, safeJsonParse } from './utils';
import { API_CONFIG, STORAGE_KEYS } from './constants';
import { getUserFriendlyError, logError, AppError, ErrorCode } from './errors';

// Re-export types from constants
export type { OrderStatus } from './constants';

// Import type for local use
import type { OrderStatus } from './constants';

// ============================================
// Type Definitions
// ============================================

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  categoryId: number;
  stock: number;
  image?: string;
  active?: boolean;
  averageRating?: number;
  ratingCount?: number;
  createdAt?: string;
  categoryName?: string;
}

export interface Rating {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  review?: string;
  helpful?: number;
  createdAt?: string;
  user?: {
    username: string;
    name: string;
  };
}

export interface RatingSummary {
  averageRating: number;
  ratingCount: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface CartItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
  image?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  userId?: number;
  guestEmail?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  shippingAddress?: ShippingAddress;
  paymentMethod?: string;
  createdAt: string;
  isGuest?: boolean;
}

export interface GuestOrderData {
  items: Array<{ productId: number; quantity: number; price?: number; productName?: string }>;
  shippingAddress: ShippingAddress;
  guestEmail: string;
  guestPhone?: string;
  paymentMethod: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: 'customer' | 'admin';
  createdAt?: string;
}

export interface Customer extends User {
  orderCount?: number;
  totalSpent?: number;
  orders?: Order[];
}

export interface AdminStats {
  products: {
    total: number;
    active: number;
    outOfStock: number;
  };
  categories: number;
  users: number;
  orders: {
    total: number;
    byStatus: Record<string, number>;
  };
  sales: {
    total: number;
    byDay: Array<{
      _id: string;
      totalSales: number;
      orderCount: number;
    }>;
  };
  topProducts: Array<{
    _id: number;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
}

export interface AdminOrder extends Order {
  user?: {
    username: string;
    email: string;
  };
}

// API Response wrapper
interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

// Query parameter types
interface ProductQueryParams {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  minRating?: number;
  sortBy?: 'newest' | 'rating' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface AdminProductParams extends PaginationParams {
  categoryId?: number;
  search?: string;
  active?: boolean;
  inStock?: boolean;
}

interface CustomerParams extends PaginationParams {
  search?: string;
}

interface AdminOrderParams extends PaginationParams {
  status?: string;
}

// ============================================
// API Client Class
// ============================================

const API_BASE = isClient()
  ? process.env.NEXT_PUBLIC_API_URL || API_CONFIG.DEFAULT_URL
  : process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || API_CONFIG.DEFAULT_URL;

class APIClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (isClient()) {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      if (userId) {
        headers['x-user-id'] = userId;
      }
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    
    // Check if online (client-side only)
    if (isClient() && !navigator.onLine) {
      throw new AppError(
        'No internet connection. Please check your network.',
        ErrorCode.NETWORK_ERROR
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // Try to parse JSON, but handle cases where response isn't JSON
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { error: text || `HTTP error! status: ${response.status}` };
      }

      if (!response.ok) {
        const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
        logError(errorMessage, `API ${options.method || 'GET'} ${endpoint}`);
        
        // Throw user-friendly error
        throw new Error(getUserFriendlyError(errorMessage));
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AppError(
          'Request timed out. Please try again.',
          ErrorCode.TIMEOUT
        );
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new AppError(
          'Unable to connect to the server. Please check your connection.',
          ErrorCode.NETWORK_ERROR
        );
      }

      // Log and re-throw other errors
      logError(error, `API ${options.method || 'GET'} ${endpoint}`);
      
      // If it's already a user-friendly error, just re-throw
      if (error instanceof AppError) {
        throw error;
      }
      
      // Convert to user-friendly error
      throw new Error(getUserFriendlyError(error));
    }
  }

  // ============================================
  // Products
  // ============================================

  async getProducts(params?: ProductQueryParams): Promise<ApiResponse<{ products: Product[]; pagination: Pagination }>> {
    return this.request(`/products${buildQueryString(params)}`);
  }

  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData: Partial<Product>): Promise<ApiResponse<Product>> {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<ApiResponse<Product>> {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: number): Promise<void> {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  // ============================================
  // Ratings
  // ============================================

  async getProductRatings(
    productId: number,
    params?: PaginationParams
  ): Promise<ApiResponse<{ ratings: Rating[]; summary: RatingSummary; pagination: Pagination }>> {
    return this.request(`/products/${productId}/ratings${buildQueryString(params)}`);
  }

  async addRating(productId: number, rating: number, review?: string): Promise<ApiResponse<Rating>> {
    return this.request(`/products/${productId}/ratings`, {
      method: 'POST',
      body: JSON.stringify({ rating, review }),
    });
  }

  async getMyRating(productId: number): Promise<ApiResponse<Rating | null>> {
    return this.request(`/products/${productId}/my-rating`);
  }

  async deleteRating(productId: number): Promise<void> {
    return this.request(`/products/${productId}/ratings`, { method: 'DELETE' });
  }

  // ============================================
  // Categories
  // ============================================

  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request('/categories');
  }

  async getCategory(id: number): Promise<ApiResponse<Category & { products?: Product[] }>> {
    return this.request(`/categories/${id}`);
  }

  async createCategory(categoryData: Partial<Category>): Promise<ApiResponse<Category>> {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<ApiResponse<Category>> {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id: number): Promise<void> {
    return this.request(`/categories/${id}`, { method: 'DELETE' });
  }

  // ============================================
  // Cart
  // ============================================

  async getCart(): Promise<ApiResponse<Cart>> {
    return this.request('/cart');
  }

  async addToCart(productId: number, quantity: number): Promise<ApiResponse<Cart>> {
    return this.request('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateCartItem(productId: number, quantity: number): Promise<ApiResponse<Cart>> {
    return this.request(`/cart/items/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(productId: number): Promise<void> {
    return this.request(`/cart/items/${productId}`, { method: 'DELETE' });
  }

  async clearCart(): Promise<void> {
    return this.request('/cart', { method: 'DELETE' });
  }

  // ============================================
  // Orders
  // ============================================

  async getOrders(): Promise<ApiResponse<Order[]>> {
    return this.request('/orders');
  }

  async getOrder(id: number): Promise<ApiResponse<Order>> {
    return this.request(`/orders/${id}`);
  }

  async createOrder(orderData: {
    items: Array<{ productId: number; quantity: number }>;
    shippingAddress: ShippingAddress;
    paymentMethod: string;
  }): Promise<ApiResponse<Order>> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async createGuestOrder(orderData: GuestOrderData): Promise<ApiResponse<Order>> {
    return this.request('/orders/guest', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getGuestOrder(orderId: number, email: string): Promise<ApiResponse<Order>> {
    return this.request(`/orders/guest/${orderId}?email=${encodeURIComponent(email)}`);
  }

  async updateOrderStatus(id: number, status: OrderStatus): Promise<ApiResponse<Order>> {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // ============================================
  // Users & Authentication
  // ============================================

  async register(userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<ApiResponse<User>> {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(username: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const data = await this.request<ApiResponse<{ user: User; token: string }>>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (isClient() && data.data?.user) {
      localStorage.setItem(STORAGE_KEYS.USER_ID, data.data.user.id.toString());
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.data.user));
    }

    return data;
  }

  logout(): void {
    if (isClient()) {
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request('/users/profile');
  }

  async updateProfile(profileData: Partial<User>): Promise<ApiResponse<User>> {
    const result = await this.request<ApiResponse<User>>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });

    if (isClient() && result.data) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.data));
    }

    return result;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message?: string }> {
    return this.request('/users/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  isAuthenticated(): boolean {
    if (!isClient()) return false;
    return !!localStorage.getItem(STORAGE_KEYS.USER_ID) && !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  getCurrentUser(): User | null {
    if (!isClient()) return null;
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? safeJsonParse<User | null>(userStr, null) : null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  // ============================================
  // Admin Methods
  // ============================================

  async getAdminStats(): Promise<ApiResponse<AdminStats>> {
    return this.request('/admin/stats');
  }

  async getAdminOrders(params?: AdminOrderParams): Promise<ApiResponse<{ orders: AdminOrder[]; pagination: Pagination }>> {
    return this.request(`/admin/orders${buildQueryString(params)}`);
  }

  async getRecentOrders(limit = 10): Promise<ApiResponse<AdminOrder[]>> {
    return this.request(`/admin/orders/recent?limit=${limit}`);
  }

  async getAdminProducts(params?: AdminProductParams): Promise<ApiResponse<{ products: Product[]; pagination: Pagination }>> {
    return this.request(`/admin/products${buildQueryString(params)}`);
  }

  async bulkUpdateProducts(
    productIds: number[],
    action: 'activate' | 'deactivate'
  ): Promise<ApiResponse<{ modifiedCount: number }>> {
    return this.request('/admin/products/bulk', {
      method: 'PUT',
      body: JSON.stringify({ productIds, action }),
    });
  }

  async updateProductStock(id: number, stock: number): Promise<ApiResponse<Product>> {
    return this.request(`/admin/products/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ stock }),
    });
  }

  async getCustomers(params?: CustomerParams): Promise<ApiResponse<{ customers: Customer[]; pagination: Pagination }>> {
    return this.request(`/admin/customers${buildQueryString(params)}`);
  }

  async getCustomer(id: number): Promise<ApiResponse<Customer>> {
    return this.request(`/admin/customers/${id}`);
  }
}

export const api = new APIClient();
