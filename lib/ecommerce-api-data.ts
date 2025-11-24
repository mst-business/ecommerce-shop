// Shared data stores for the ecommerce API
// This file contains the in-memory data that will be shared across API routes

export interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  categoryId: number;
  stock: number;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
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
  updatedAt?: string;
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
  password: string;
  firstName?: string;
  lastName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  productId: number;
  quantity: number;
}

// In-Memory Data Stores
export let products: Product[] = [
  { id: 1, name: 'T-shirt', price: 19.99, description: 'Comfortable cotton t-shirt', categoryId: 1, stock: 50, image: '/images/tshirt.jpg', createdAt: new Date().toISOString() },
  { id: 2, name: 'Jeans', price: 49.99, description: 'Classic blue jeans', categoryId: 1, stock: 30, image: '/images/jeans.jpg', createdAt: new Date().toISOString() },
  { id: 3, name: 'Sneakers', price: 89.99, description: 'Running sneakers', categoryId: 2, stock: 25, image: '/images/sneakers.jpg', createdAt: new Date().toISOString() }
];

export let categories: Category[] = [
  { id: 1, name: 'Clothing', description: 'Apparel and clothing items' },
  { id: 2, name: 'Footwear', description: 'Shoes and boots' },
  { id: 3, name: 'Accessories', description: 'Fashion accessories' }
];

export let orders: Order[] = [];
export let users: User[] = [];
export let carts: Record<number, CartItem[]> = {}; // userId -> cart items

export let nextProductId = 4;
export let nextOrderId = 1;
export let nextCategoryId = 4;
export let nextUserId = 1;

// Helper Functions
export function generateId(type: 'product' | 'order' | 'category' | 'user'): number {
  switch(type) {
    case 'product': return nextProductId++;
    case 'order': return nextOrderId++;
    case 'category': return nextCategoryId++;
    case 'user': return nextUserId++;
    default: return Date.now();
  }
}

export function validateRequired(data: any, requiredFields: string[]): { valid: boolean; error?: string } {
  const missing = requiredFields.filter(field => !data[field]);
  if (missing.length > 0) {
    return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }
  return { valid: true };
}

// Helper functions are now in individual route files

