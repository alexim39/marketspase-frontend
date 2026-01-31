// cart.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  maxQuantity?: number;
  sku?: string;
  storeId: string;
  storeName?: string;
  isDigital?: boolean;
  requiresShipping?: boolean;
}

export interface CartSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phoneNumber: string;
  email: string;
}

export interface CartDiscount {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
  minPurchase?: number;
}

@Injectable()
export class CartService {
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  // Cart state using signals
  private cartItems = signal<CartItem[]>(this.loadCartFromStorage());
  private shippingAddress = signal<ShippingAddress | null>(this.loadAddressFromStorage());
  private discount = signal<CartDiscount | null>(this.loadDiscountFromStorage());

  // Computed values
  cartItemCount = computed(() => 
    this.cartItems().reduce((total, item) => total + item.quantity, 0)
  );

  cartSubtotal = computed(() =>
    this.cartItems().reduce((total, item) => total + (item.price * item.quantity), 0)
  );

  cartSummary = computed((): CartSummary => {
    const subtotal = this.cartSubtotal();
    const shipping = this.calculateShipping();
    const tax = this.calculateTax(subtotal);
    const discount = this.calculateDiscount(subtotal);
    const itemCount = this.cartItemCount();

    return {
      subtotal,
      shipping,
      tax,
      discount,
      total: subtotal + shipping + tax - discount,
      itemCount
    };
  });

  cartItemsSignal = this.cartItems.asReadonly();

  // Cart Management Methods
  addToCart(item: Omit<CartItem, 'quantity'> & { quantity?: number }): void {
    const quantity = item.quantity || 1;
    const existingItemIndex = this.findCartItemIndex(item.productId, item.variantId);

    if (existingItemIndex > -1) {
      // Update existing item quantity
      const updatedItems = [...this.cartItems()];
      const existingItem = updatedItems[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      // Check if exceeds max quantity
      if (existingItem.maxQuantity && newQuantity > existingItem.maxQuantity) {
        this.snackBar.open(
          `Cannot add more than ${existingItem.maxQuantity} of this item`,
          'Close',
          { duration: 3000, panelClass: ['error-snackbar'] }
        );
        return;
      }

      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity
      };
      this.cartItems.set(updatedItems);
    } else {
      // Add new item
      const newItem: CartItem = {
        ...item,
        quantity
      };
      this.cartItems.update(items => [...items, newItem]);
    }

    this.saveCartToStorage();
    this.showNotification(`${item.name} added to cart`, 'View Cart');
  }

  updateQuantity(productId: string, quantity: number, variantId?: string): void {
    const itemIndex = this.findCartItemIndex(productId, variantId);
    
    if (itemIndex > -1) {
      if (quantity <= 0) {
        this.removeItem(productId, variantId);
        return;
      }

      const updatedItems = [...this.cartItems()];
      const item = updatedItems[itemIndex];
      
      // Check max quantity
      if (item.maxQuantity && quantity > item.maxQuantity) {
        this.snackBar.open(
          `Maximum quantity is ${item.maxQuantity}`,
          'Close',
          { duration: 3000 }
        );
        return;
      }

      updatedItems[itemIndex] = {
        ...item,
        quantity
      };
      this.cartItems.set(updatedItems);
      this.saveCartToStorage();
    }
  }

  incrementQuantity(productId: string, variantId?: string): void {
    const item = this.getCartItem(productId, variantId);
    if (item) {
      this.updateQuantity(productId, item.quantity + 1, variantId);
    }
  }

  decrementQuantity(productId: string, variantId?: string): void {
    const item = this.getCartItem(productId, variantId);
    if (item) {
      this.updateQuantity(productId, item.quantity - 1, variantId);
    }
  }

  removeItem(productId: string, variantId?: string): void {
    this.cartItems.update(items => 
      items.filter(item => 
        !(item.productId === productId && item.variantId === variantId)
      )
    );
    this.saveCartToStorage();
    this.snackBar.open('Item removed from cart', 'Close', { duration: 2000 });
  }

  clearCart(): void {
    this.cartItems.set([]);
    this.discount.set(null);
    localStorage.removeItem('marketspase_cart');
    localStorage.removeItem('marketspase_cart_discount');
  }

  getCartItem(productId: string, variantId?: string): CartItem | undefined {
    return this.cartItems().find(item => 
      item.productId === productId && item.variantId === variantId
    );
  }

  hasDigitalProducts(): boolean {
    return this.cartItems().some(item => item.isDigital);
  }

  hasPhysicalProducts(): boolean {
    return this.cartItems().some(item => item.requiresShipping !== false);
  }

  getStoreIds(): string[] {
    const storeIds = new Set(this.cartItems().map(item => item.storeId));
    return Array.from(storeIds);
  }

  // Shipping & Address
  setShippingAddress(address: ShippingAddress): void {
    this.shippingAddress.set(address);
    localStorage.setItem('marketspase_shipping_address', JSON.stringify(address));
  }

  getShippingAddress(): ShippingAddress | null {
    return this.shippingAddress();
  }

  private calculateShipping(): number {
    // Basic shipping calculation - can be enhanced with real shipping APIs
    const items = this.cartItems();
    if (items.length === 0) return 0;
    
    // Digital products have no shipping
    if (!this.hasPhysicalProducts()) return 0;
    
    // Free shipping for orders over $50
    if (this.cartSubtotal() >= 50) return 0;
    
    // Flat rate shipping
    return 5.99;
  }

  private calculateTax(subtotal: number): number {
    // Simplified tax calculation - should be based on location
    const taxRate = 0.08; // 8% tax rate
    return subtotal * taxRate;
  }

  // Discounts
  applyDiscount(code: string): { success: boolean; message: string } {
    // Mock discount validation - integrate with backend in production
    const discounts: Record<string, CartDiscount> = {
      'WELCOME10': {
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        description: '10% off your first order',
        minPurchase: 20
      },
      'FREESHIP': {
        code: 'FREESHIP',
        type: 'fixed',
        value: 5.99,
        description: 'Free shipping on your order'
      },
      'SAVE20': {
        code: 'SAVE20',
        type: 'percentage',
        value: 20,
        description: '20% off selected items',
        minPurchase: 50
      }
    };

    const discount = discounts[code.toUpperCase()];
    
    if (!discount) {
      return { success: false, message: 'Invalid discount code' };
    }

    if (discount.minPurchase && this.cartSubtotal() < discount.minPurchase) {
      return { 
        success: false, 
        message: `Minimum purchase of $${discount.minPurchase} required` 
      };
    }

    this.discount.set(discount);
    localStorage.setItem('marketspase_cart_discount', JSON.stringify(discount));
    
    return { 
      success: true, 
      message: `Discount applied: ${discount.description}` 
    };
  }

  removeDiscount(): void {
    this.discount.set(null);
    localStorage.removeItem('marketspase_cart_discount');
  }

  getCurrentDiscount(): CartDiscount | null {
    return this.discount();
  }

  private calculateDiscount(subtotal: number): number {
    const discount = this.discount();
    if (!discount) return 0;

    if (discount.type === 'percentage') {
      return (subtotal * discount.value) / 100;
    } else {
      return discount.value;
    }
  }

  // Checkout
  proceedToCheckout(): void {
    if (this.cartItems().length === 0) {
      this.snackBar.open('Your cart is empty', 'Close', { duration: 3000 });
      return;
    }

    this.router.navigate(['/checkout']);
  }

  // Persistence
  private loadCartFromStorage(): CartItem[] {
    try {
      const cartJson = localStorage.getItem('marketspase_cart');
      return cartJson ? JSON.parse(cartJson) : [];
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      return [];
    }
  }

  private saveCartToStorage(): void {
    try {
      localStorage.setItem('marketspase_cart', JSON.stringify(this.cartItems()));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

  private loadAddressFromStorage(): ShippingAddress | null {
    try {
      const addressJson = localStorage.getItem('marketspase_shipping_address');
      return addressJson ? JSON.parse(addressJson) : null;
    } catch (error) {
      console.error('Error loading address from storage:', error);
      return null;
    }
  }

  private loadDiscountFromStorage(): CartDiscount | null {
    try {
      const discountJson = localStorage.getItem('marketspase_cart_discount');
      return discountJson ? JSON.parse(discountJson) : null;
    } catch (error) {
      console.error('Error loading discount from storage:', error);
      return null;
    }
  }

  // Helper Methods
  private findCartItemIndex(productId: string, variantId?: string): number {
    return this.cartItems().findIndex(item => 
      item.productId === productId && item.variantId === variantId
    );
  }

  private showNotification(message: string, action?: string): void {
    const snackBarRef = this.snackBar.open(message, action, {
      duration: 3000,
      panelClass: ['success-snackbar']
    });

    if (action === 'View Cart') {
      snackBarRef.onAction().subscribe(() => {
        this.router.navigate(['/cart']);
      });
    }
  }

  // Cart Analysis
  getCartByStore(): Map<string, CartItem[]> {
    const storeMap = new Map<string, CartItem[]>();
    
    this.cartItems().forEach(item => {
      const storeItems = storeMap.get(item.storeId) || [];
      storeItems.push(item);
      storeMap.set(item.storeId, storeItems);
    });
    
    return storeMap;
  }

  getEstimatedDelivery(): Date {
    const today = new Date();
    const deliveryDate = new Date(today);
    
    // Add business days for shipping
    let businessDays = 3; // Standard delivery
    const hasExpedited = this.cartItems().some(item => 
      item.storeName?.toLowerCase().includes('premium')
    );
    
    if (hasExpedited) {
      businessDays = 1;
    }
    
    // Add business days (skip weekends)
    while (businessDays > 0) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) {
        businessDays--;
      }
    }
    
    return deliveryDate;
  }

  // Cart Validation
  validateCart(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for out of stock items
    this.cartItems().forEach(item => {
      if (item.maxQuantity && item.quantity > item.maxQuantity) {
        errors.push(`${item.name} - Only ${item.maxQuantity} available`);
      }
    });
    
    // Check for items with shipping restrictions
    const digitalItems = this.cartItems().filter(item => item.isDigital);
    const physicalItems = this.cartItems().filter(item => !item.isDigital);
    
    if (digitalItems.length > 0 && physicalItems.length > 0) {
      // Mixed cart - check if store supports mixed shipping
      const storeIds = new Set(this.cartItems().map(item => item.storeId));
      if (storeIds.size > 1) {
        errors.push('Cannot mix digital and physical products from different stores');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}