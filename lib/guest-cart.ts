/**
 * Guest Cart Utility - Stores cart in localStorage for non-authenticated users
 */
import { STORAGE_KEYS } from './constants';
import { isClient } from './utils';

export interface GuestCartItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
  image?: string;
}

export interface GuestCart {
  items: GuestCartItem[];
  total: number;
  itemCount: number;
}

class GuestCartManager {
  private readonly emptyCart: GuestCart = { items: [], total: 0, itemCount: 0 };

  private getStoredCart(): GuestCart {
    if (!isClient()) return this.emptyCart;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GUEST_CART);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading guest cart:', error);
    }
    
    return this.emptyCart;
  }

  private saveCart(cart: GuestCart): void {
    if (!isClient()) return;
    
    try {
      localStorage.setItem(STORAGE_KEYS.GUEST_CART, JSON.stringify(cart));
      // Dispatch event for cart updates
      window.dispatchEvent(new CustomEvent('guestCartUpdated', { detail: cart }));
    } catch (error) {
      console.error('Error saving guest cart:', error);
    }
  }

  private recalculateCart(items: GuestCartItem[]): GuestCart {
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return { items, total, itemCount };
  }

  getCart(): GuestCart {
    return this.getStoredCart();
  }

  addItem(product: { id: number; name: string; price: number; image?: string }, quantity: number): GuestCart {
    const cart = this.getStoredCart();
    const existingIndex = cart.items.findIndex(item => item.productId === product.id);
    
    if (existingIndex >= 0) {
      // Update existing item
      cart.items[existingIndex].quantity += quantity;
      cart.items[existingIndex].subtotal = cart.items[existingIndex].price * cart.items[existingIndex].quantity;
    } else {
      // Add new item
      cart.items.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity,
        subtotal: product.price * quantity,
        image: product.image,
      });
    }
    
    const updatedCart = this.recalculateCart(cart.items);
    this.saveCart(updatedCart);
    return updatedCart;
  }

  updateItemQuantity(productId: number, quantity: number): GuestCart {
    const cart = this.getStoredCart();
    const existingIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (existingIndex >= 0) {
      if (quantity <= 0) {
        // Remove item
        cart.items.splice(existingIndex, 1);
      } else {
        cart.items[existingIndex].quantity = quantity;
        cart.items[existingIndex].subtotal = cart.items[existingIndex].price * quantity;
      }
    }
    
    const updatedCart = this.recalculateCart(cart.items);
    this.saveCart(updatedCart);
    return updatedCart;
  }

  removeItem(productId: number): GuestCart {
    const cart = this.getStoredCart();
    cart.items = cart.items.filter(item => item.productId !== productId);
    
    const updatedCart = this.recalculateCart(cart.items);
    this.saveCart(updatedCart);
    return updatedCart;
  }

  clearCart(): void {
    this.saveCart({ items: [], total: 0, itemCount: 0 });
  }

  getItemCount(): number {
    return this.getStoredCart().itemCount;
  }

  // Merge guest cart with server cart after login
  async mergeWithServerCart(addToServerCart: (productId: number, quantity: number) => Promise<void>): Promise<void> {
    const guestCart = this.getStoredCart();
    
    for (const item of guestCart.items) {
      try {
        await addToServerCart(item.productId, item.quantity);
      } catch (error) {
        console.error(`Failed to merge item ${item.productId}:`, error);
      }
    }
    
    // Clear guest cart after merging
    this.clearCart();
  }
}

export const guestCart = new GuestCartManager();

