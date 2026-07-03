import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api';

export interface StorefrontCartItem {
  id: string;
  productId: string;
  variantId?: string;
  variantName?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  storeId: string;
  storeName?: string;
  storeLink?: string;
  currency?: string;
  maxQuantity?: number;
  manageStock?: boolean;
  soldIndividually?: boolean;
  trackingCode?: string | null;
  uniqueId?: string | null;
  promoterId?: string | null;
}

export interface StorefrontCartGroup {
  storeId: string;
  storeName?: string;
  storeLink?: string;
  currency: string;
  items: StorefrontCartItem[];
  itemCount: number;
  subtotal: number;
}

@Injectable({ providedIn: 'root' })
export class StorefrontCartService {
  private readonly apiService = inject(ApiService);
  private readonly storageKey = 'marketspase_storefront_cart_v1';
  private readonly _items = signal<StorefrontCartItem[]>(this.readItems());

  readonly items = this._items.asReadonly();
  readonly itemCount = computed(() => this._items().reduce((sum, item) => sum + item.quantity, 0));
  readonly subtotal = computed(() => this._items().reduce((sum, item) => sum + item.price * item.quantity, 0));
  readonly groups = computed(() => this.groupItems(this._items()));

  addItem(item: Omit<StorefrontCartItem, 'id'>): StorefrontCartItem {
    const normalized = this.normalizeItem(item);
    const id = this.makeItemId(normalized);
    const existing = this._items().find(cartItem => cartItem.id === id);

    if (existing) {
      const nextQuantity = this.clampQuantity(
        existing.quantity + normalized.quantity,
        existing.maxQuantity,
        existing.soldIndividually
      );
      this.updateQuantity(id, nextQuantity);
      return { ...existing, quantity: nextQuantity };
    }

    const cartItem: StorefrontCartItem = { ...normalized, id };
    this.setItems([...this._items(), cartItem]);
    return cartItem;
  }

  updateQuantity(itemId: string, quantity: number): void {
    const items = this._items().map(item => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        quantity: this.clampQuantity(quantity, item.maxQuantity, item.soldIndividually)
      };
    });
    this.setItems(items);
  }

  removeItem(itemId: string): void {
    this.setItems(this._items().filter(item => item.id !== itemId));
  }

  clear(): void {
    this.setItems([]);
  }

  clearStore(storeId: string): void {
    this.setItems(this._items().filter(item => item.storeId !== storeId));
  }

  saveCartSnapshot(email?: string): Observable<any> {
    const items = this._items();
    return this.apiService.post('api/v1/stores/storefront/cart/snapshot', {
      items: items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        storeId: item.storeId,
        trackingCode: item.trackingCode,
        uniqueId: item.uniqueId,
        promoterId: item.promoterId
      })),
      email: email || '',
      trackingCode: items[0]?.trackingCode || null,
      uniqueId: items[0]?.uniqueId || null,
      promoterId: items[0]?.promoterId || null,
      currency: items[0]?.currency || 'NGN',
      totalAmount: this.subtotal()
    }, undefined, true);
  }

  private normalizeItem(item: Omit<StorefrontCartItem, 'id'>): Omit<StorefrontCartItem, 'id'> {
    return {
      ...item,
      currency: item.currency || 'NGN',
      quantity: this.clampQuantity(item.quantity || 1, item.maxQuantity, item.soldIndividually),
      price: Number(item.price) || 0,
      trackingCode: item.trackingCode || null,
      uniqueId: item.uniqueId || null,
      promoterId: item.promoterId || null
    };
  }

  private clampQuantity(quantity: number, maxQuantity?: number, soldIndividually?: boolean): number {
    if (soldIndividually) return 1;
    const max = Math.max(1, maxQuantity || 999);
    return Math.min(Math.max(1, Math.floor(quantity || 1)), max);
  }

  private makeItemId(item: Omit<StorefrontCartItem, 'id'>): string {
    return [
      item.storeId,
      item.productId,
      item.variantId || 'base',
      item.trackingCode || item.uniqueId || 'organic'
    ].join(':');
  }

  private groupItems(items: StorefrontCartItem[]): StorefrontCartGroup[] {
    const groups = new Map<string, StorefrontCartGroup>();

    for (const item of items) {
      const current = groups.get(item.storeId) || {
        storeId: item.storeId,
        storeName: item.storeName,
        storeLink: item.storeLink,
        currency: item.currency || 'NGN',
        items: [],
        itemCount: 0,
        subtotal: 0
      };

      current.items.push(item);
      current.itemCount += item.quantity;
      current.subtotal += item.price * item.quantity;
      groups.set(item.storeId, current);
    }

    return Array.from(groups.values());
  }

  private setItems(items: StorefrontCartItem[]): void {
    this._items.set(items);
    this.writeItems(items);
  }

  private readItems(): StorefrontCartItem[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeItems(items: StorefrontCartItem[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch {
      // Storage may be unavailable in private browsing; the in-memory cart still works.
    }
  }
}
