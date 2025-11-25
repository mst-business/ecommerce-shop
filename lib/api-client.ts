// API Client for E-commerce API
// Points to the standalone API server
const DEFAULT_API_URL = 'http://localhost:3001/api';
const API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
    : process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;

export interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  categoryId: number;
  stock: number;
  image?: string;
  active?: boolean;
  createdAt?: string;
  categoryName?: string;
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

export interface Order {
  id: number;
  userId: number;
  items: OrderItem[];
  total: number;
  status: string;
  shippingAddress?: any;
  paymentMethod?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
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

class APIClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('userId');
      if (userId) {
        headers['x-user-id'] = userId;
      }
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Products
  async getProducts(params?: {
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: { products: Product[]; pagination?: any } }> {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, v.toString()])
        ).toString()
      : '';
    return this.request(`/products${queryString}`);
  }

  async getProduct(id: number): Promise<{ data: Product }> {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData: Partial<Product>): Promise<{ data: Product }> {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(
    id: number,
    productData: Partial<Product>
  ): Promise<{ data: Product }> {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: number): Promise<void> {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  async getCategories(): Promise<{ data: Category[] }> {
    return this.request('/categories');
  }

  async getCategory(id: number): Promise<{ data: Category & { products?: Product[] } }> {
    return this.request(`/categories/${id}`);
  }

  async createCategory(categoryData: Partial<Category>): Promise<{ data: Category }> {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(
    id: number,
    categoryData: Partial<Category>
  ): Promise<{ data: Category }> {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id: number): Promise<void> {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Cart
  async getCart(): Promise<{ data: Cart }> {
    return this.request('/cart');
  }

  async addToCart(productId: number, quantity: number): Promise<{ data: any }> {
    return this.request('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateCartItem(productId: number, quantity: number): Promise<{ data: any }> {
    return this.request(`/cart/items/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(productId: number): Promise<void> {
    return this.request(`/cart/items/${productId}`, {
      method: 'DELETE',
    });
  }

  async clearCart(): Promise<void> {
    return this.request('/cart', {
      method: 'DELETE',
    });
  }

  // Orders
  async getOrders(): Promise<{ data: Order[] }> {
    return this.request('/orders');
  }

  async getOrder(id: number): Promise<{ data: Order }> {
    return this.request(`/orders/${id}`);
  }

  async createOrder(orderData: {
    items: Array<{ productId: number; quantity: number }>;
    shippingAddress: any;
    paymentMethod: string;
  }): Promise<{ data: Order }> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrderStatus(id: number, status: string): Promise<{ data: Order }> {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Users
  async register(userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<{ data: User; message?: string }> {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(username: string, password: string): Promise<{
    data: { user: User; token: string };
    message?: string;
  }> {
    const data = await this.request<{
      data: { user: User; token: string };
      message?: string;
    }>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (typeof window !== 'undefined' && data.data?.user) {
      localStorage.setItem('userId', data.data.user.id.toString());
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }

    return data;
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userId');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  async getProfile(): Promise<{ data: User }> {
    return this.request('/users/profile');
  }

  async updateProfile(profileData: Partial<User>): Promise<{ data: User }> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('userId') && !!localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Admin Methods
  async getAdminStats(): Promise<{ data: AdminStats }> {
    return this.request('/admin/stats');
  }

  async getAdminOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ data: { orders: AdminOrder[]; pagination: any } }> {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, v.toString()])
        ).toString()
      : '';
    return this.request(`/admin/orders${queryString}`);
  }

  async getRecentOrders(limit?: number): Promise<{ data: AdminOrder[] }> {
    return this.request(`/admin/orders/recent?limit=${limit || 10}`);
  }

  async getAdminProducts(params?: {
    categoryId?: number;
    search?: string;
    active?: boolean;
    inStock?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: { products: Product[]; pagination: any } }> {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, v.toString()])
        ).toString()
      : '';
    return this.request(`/admin/products${queryString}`);
  }

  async bulkUpdateProducts(
    productIds: number[],
    action: 'activate' | 'deactivate'
  ): Promise<{ data: { modifiedCount: number }; message?: string }> {
    return this.request('/admin/products/bulk', {
      method: 'PUT',
      body: JSON.stringify({ productIds, action }),
    });
  }

  async updateProductStock(id: number, stock: number): Promise<{ data: Product }> {
    return this.request(`/admin/products/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ stock }),
    });
  }

  async getCustomers(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: { customers: Customer[]; pagination: any } }> {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, v.toString()])
        ).toString()
      : '';
    return this.request(`/admin/customers${queryString}`);
  }

  async getCustomer(id: number): Promise<{ data: Customer }> {
    return this.request(`/admin/customers/${id}`);
  }
}

export const api = new APIClient();

