// wishlist.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  storeId: string;
  storeName?: string;
  category: string;
  addedAt: Date;
  isAvailable?: boolean;
  originalPrice?: number;
  discountPercentage?: number;
}

export interface FavoriteStore {
  storeId: string;
  storeName: string;
  logo?: string;
  category?: string;
  addedAt: Date;
}

@Injectable()
export class WishlistService {
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  // Wishlist state using signals
  private wishlistItems = signal<WishlistItem[]>(this.loadWishlistFromStorage());
  private favoriteStores = signal<FavoriteStore[]>(this.loadFavoriteStoresFromStorage());

  // Computed values
  wishlistCount = computed(() => this.wishlistItems().length);
  
  wishlistByCategory = computed(() => {
    const items = this.wishlistItems();
    const categories = new Map<string, WishlistItem[]>();
    
    items.forEach(item => {
      const categoryItems = categories.get(item.category) || [];
      categoryItems.push(item);
      categories.set(item.category, categoryItems);
    });
    
    return categories;
  });

  wishlistSummary = computed(() => {
    const items = this.wishlistItems();
    const totalValue = items.reduce((sum, item) => sum + item.price, 0);
    const avgPrice = items.length > 0 ? totalValue / items.length : 0;
    const stores = new Set(items.map(item => item.storeId)).size;
    
    return {
      totalItems: items.length,
      totalValue,
      avgPrice,
      stores,
      categories: new Set(items.map(item => item.category)).size
    };
  });

  wishlistItemsSignal = this.wishlistItems.asReadonly();
  favoriteStoresSignal = this.favoriteStores.asReadonly();

  // Wishlist Management
  addToWishlist(item: Omit<WishlistItem, 'addedAt'>): void {
    const existingItem = this.getWishlistItem(item.productId);
    
    if (existingItem) {
      this.snackBar.open('Item already in wishlist', 'Close', { duration: 2000 });
      return;
    }

    const wishlistItem: WishlistItem = {
      ...item,
      addedAt: new Date()
    };

    this.wishlistItems.update(items => [...items, wishlistItem]);
    this.saveWishlistToStorage();
    
    this.showNotification(`${item.name} added to wishlist`, 'View Wishlist');
  }

  removeFromWishlist(productId: string): void {
    this.wishlistItems.update(items => 
      items.filter(item => item.productId !== productId)
    );
    this.saveWishlistToStorage();
  }

  clearWishlist(): void {
    this.wishlistItems.set([]);
    localStorage.removeItem('marketspase_wishlist');
  }

  getWishlistItem(productId: string): WishlistItem | undefined {
    return this.wishlistItems().find(item => item.productId === productId);
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistItems().some(item => item.productId === productId);
  }

  getWishlistProductIds(): string[] {
    return this.wishlistItems().map(item => item.productId);
  }

  moveToCart(productId: string): void {
    const item = this.getWishlistItem(productId);
    if (item) {
      this.removeFromWishlist(productId);
      // Emit event or call cart service
      this.snackBar.open(`${item.name} moved to cart`, 'View Cart', { duration: 3000 })
        .onAction()
        .subscribe(() => {
          this.router.navigate(['/cart']);
        });
    }
  }

  // Store Favorites
  addFavoriteStore(store: Omit<FavoriteStore, 'addedAt'>): void {
    const existingStore = this.getFavoriteStore(store.storeId);
    
    if (existingStore) {
      this.snackBar.open('Store already in favorites', 'Close', { duration: 2000 });
      return;
    }

    const favoriteStore: FavoriteStore = {
      ...store,
      addedAt: new Date()
    };

    this.favoriteStores.update(stores => [...stores, favoriteStore]);
    this.saveFavoriteStoresToStorage();
    
    this.snackBar.open(`${store.storeName} added to favorites`, 'Close', { duration: 2000 });
  }

  removeFavoriteStore(storeId: string): void {
    this.favoriteStores.update(stores => 
      stores.filter(store => store.storeId !== storeId)
    );
    this.saveFavoriteStoresToStorage();
  }

  getFavoriteStore(storeId: string): FavoriteStore | undefined {
    return this.favoriteStores().find(store => store.storeId === storeId);
  }

  isStoreFavorited(storeId: string): boolean {
    return this.favoriteStores().some(store => store.storeId === storeId);
  }

  getStoreWishlistCount(storeId: string): number {
    return this.wishlistItems().filter(item => item.storeId === storeId).length;
  }

  // Wishlist Analysis
  getWishlistStats(): {
    byStore: Map<string, number>;
    byCategory: Map<string, number>;
    byPriceRange: { range: string; count: number }[];
  } {
    const items = this.wishlistItems();
    
    // Group by store
    const byStore = new Map<string, number>();
    items.forEach(item => {
      const count = byStore.get(item.storeId) || 0;
      byStore.set(item.storeId, count + 1);
    });

    // Group by category
    const byCategory = new Map<string, number>();
    items.forEach(item => {
      const count = byCategory.get(item.category) || 0;
      byCategory.set(item.category, count + 1);
    });

    // Price ranges
    const priceRanges = [
      { min: 0, max: 50, label: 'Under $50' },
      { min: 50, max: 100, label: '$50 - $100' },
      { min: 100, max: 200, label: '$100 - $200' },
      { min: 200, max: 500, label: '$200 - $500' },
      { min: 500, max: Infinity, label: '$500+' }
    ];

    const byPriceRange = priceRanges.map(range => ({
      range: range.label,
      count: items.filter(item => item.price >= range.min && item.price < range.max).length
    }));

    return { byStore, byCategory, byPriceRange };
  }

  getRecentlyAdded(limit: number = 5): WishlistItem[] {
    return [...this.wishlistItems()]
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
      .slice(0, limit);
  }

  getWishlistByStore(storeId: string): WishlistItem[] {
    return this.wishlistItems().filter(item => item.storeId === storeId);
  }

  // Price Tracking
  updateItemPrice(productId: string, newPrice: number, originalPrice?: number): void {
    const itemIndex = this.wishlistItems().findIndex(item => item.productId === productId);
    
    if (itemIndex > -1) {
      const updatedItems = [...this.wishlistItems()];
      const item = updatedItems[itemIndex];
      const oldPrice = item.price;
      
      updatedItems[itemIndex] = {
        ...item,
        price: newPrice,
        originalPrice: originalPrice || item.originalPrice,
        discountPercentage: originalPrice && originalPrice > newPrice 
          ? Math.round(((originalPrice - newPrice) / originalPrice) * 100)
          : item.discountPercentage
      };
      
      this.wishlistItems.set(updatedItems);
      this.saveWishlistToStorage();
      
      // Notify if price dropped
      if (newPrice < oldPrice) {
        const priceDrop = oldPrice - newPrice;
        const percentageDrop = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
        
        this.snackBar.open(
          `Price dropped for ${item.name}! Save $${priceDrop.toFixed(2)} (${percentageDrop}%)`,
          'View Item',
          { duration: 5000, panelClass: ['info-snackbar'] }
        ).onAction().subscribe(() => {
          this.router.navigate(['/product', productId]);
        });
      }
    }
  }

  // Wishlist Sharing
  shareWishlist(): void {
    const items = this.wishlistItems();
    if (items.length === 0) {
      this.snackBar.open('Your wishlist is empty', 'Close', { duration: 3000 });
      return;
    }

    const wishlistData = {
      title: 'My Wishlist',
      items: items.map(item => ({
        name: item.name,
        price: item.price,
        store: item.storeName
      }))
    };

    // In a real app, this would generate a shareable link
    const shareText = `My Wishlist:\n\n${items.map(item => 
      `• ${item.name} - $${item.price} (${item.storeName})`
    ).join('\n')}`;

    if (navigator.share) {
      navigator.share({
        title: 'My Wishlist',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        this.snackBar.open('Wishlist copied to clipboard', 'Close', { duration: 3000 });
      });
    }
  }

  // Export/Import
  exportWishlist(): string {
    const data = {
      items: this.wishlistItems(),
      stores: this.favoriteStores(),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  }

  importWishlist(json: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(json);
      
      if (!data.items || !Array.isArray(data.items)) {
        return { success: false, message: 'Invalid wishlist format' };
      }

      // Merge imported items
      const currentItems = this.wishlistItems();
      const newItems = data.items.filter((importedItem: any) => 
        !currentItems.some(item => item.productId === importedItem.productId)
      );

      if (newItems.length > 0) {
        this.wishlistItems.update(items => [
          ...items,
          ...newItems.map((item: any) => ({
            ...item,
            addedAt: new Date(item.addedAt || new Date())
          }))
        ]);
        this.saveWishlistToStorage();
      }

      return { 
        success: true, 
        message: `Added ${newItems.length} new items to wishlist` 
      };
    } catch (error) {
      console.error('Error importing wishlist:', error);
      return { success: false, message: 'Error importing wishlist' };
    }
  }

  // Persistence
  private loadWishlistFromStorage(): WishlistItem[] {
    try {
      const wishlistJson = localStorage.getItem('marketspase_wishlist');
      if (!wishlistJson) return [];

      const data = JSON.parse(wishlistJson);
      return data.map((item: any) => ({
        ...item,
        addedAt: new Date(item.addedAt)
      }));
    } catch (error) {
      console.error('Error loading wishlist from storage:', error);
      return [];
    }
  }

  private saveWishlistToStorage(): void {
    try {
      localStorage.setItem('marketspase_wishlist', JSON.stringify(this.wishlistItems()));
    } catch (error) {
      console.error('Error saving wishlist to storage:', error);
    }
  }

  private loadFavoriteStoresFromStorage(): FavoriteStore[] {
    try {
      const storesJson = localStorage.getItem('marketspase_favorite_stores');
      if (!storesJson) return [];

      const data = JSON.parse(storesJson);
      return data.map((store: any) => ({
        ...store,
        addedAt: new Date(store.addedAt)
      }));
    } catch (error) {
      console.error('Error loading favorite stores from storage:', error);
      return [];
    }
  }

  private saveFavoriteStoresToStorage(): void {
    try {
      localStorage.setItem('marketspase_favorite_stores', JSON.stringify(this.favoriteStores()));
    } catch (error) {
      console.error('Error saving favorite stores to storage:', error);
    }
  }

  // Helper Methods
  private showNotification(message: string, action?: string): void {
    const snackBarRef = this.snackBar.open(message, action, {
      duration: 3000,
      panelClass: ['success-snackbar']
    });

    if (action === 'View Wishlist') {
      snackBarRef.onAction().subscribe(() => {
        this.router.navigate(['/wishlist']);
      });
    }
  }

  // Wishlist Cleanup
  removeUnavailableItems(): number {
    const initialCount = this.wishlistItems().length;
    
    this.wishlistItems.update(items => 
      items.filter(item => item.isAvailable !== false)
    );
    
    this.saveWishlistToStorage();
    
    const removedCount = initialCount - this.wishlistItems().length;
    if (removedCount > 0) {
      this.snackBar.open(
        `Removed ${removedCount} unavailable items from wishlist`,
        'Close',
        { duration: 3000 }
      );
    }
    
    return removedCount;
  }

  // Wishlist Sorting
  sortWishlist(criteria: 'date' | 'price' | 'name' | 'store'): void {
    const items = [...this.wishlistItems()];
    
    switch (criteria) {
      case 'date':
        items.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
        break;
      case 'price':
        items.sort((a, b) => a.price - b.price);
        break;
      case 'name':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'store':
        items.sort((a, b) => (a.storeName || '').localeCompare(b.storeName || ''));
        break;
    }
    
    this.wishlistItems.set(items);
    this.saveWishlistToStorage();
  }

  // Bulk Operations
  moveMultipleToCart(productIds: string[]): number {
    let movedCount = 0;
    
    productIds.forEach(productId => {
      const item = this.getWishlistItem(productId);
      if (item) {
        this.moveToCart(productId);
        movedCount++;
      }
    });
    
    return movedCount;
  }

  removeMultiple(productIds: string[]): number {
    const initialCount = this.wishlistItems().length;
    
    this.wishlistItems.update(items => 
      items.filter(item => !productIds.includes(item.productId))
    );
    
    this.saveWishlistToStorage();
    
    const removedCount = initialCount - this.wishlistItems().length;
    if (removedCount > 0) {
      this.snackBar.open(
        `Removed ${removedCount} items from wishlist`,
        'Close',
        { duration: 3000 }
      );
    }
    
    return removedCount;
  }
}