// components/store-header/store-header.component.ts
import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '../../models/store.model';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-store-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './store-header.component.html',
  styleUrls: ['./store-header.component.scss']
})
export class StoreHeaderComponent {
  // Inputs
  store = input<Store | null>(null);
  stores = input<Store[]>([]);
  loading = input<boolean>(false);
  private snackBar = inject(MatSnackBar);

  // Outputs
  createStore = output<void>();
  manageStore = output<string>();
  verifyStore = output<void>();
  addProduct = output<void>();
  exportData = output<void>();
  duplicateStore = output<void>();
  archiveStore = output<void>();

  // Computed properties
  storeStatus = computed(() => {
    const store = this.store();
    if (!store) return 'no-store';
    
    if (!store.isActive) return 'inactive';
    if (store.isVerified) return 'verified';
    return 'active';
  });

  storeStats = computed(() => {
    const store = this.store();
    if (!store) return null;

    return {
      views: store.analytics.totalViews,
      sales: store.analytics.totalSales,
      conversion: store.analytics.conversionRate,
      revenue: 0 //store.analytics.salesData.totalRevenue
    };
  });

  statusColor = computed(() => {
    const status = this.storeStatus();
    const colors = {
      'no-store': 'default',
      'active': 'primary',
      'verified': 'accent',
      'suspended': 'warn',
      'inactive': 'warn'
    };
    return colors[status] || 'default';
  });

  statusIcon = computed(() => {
    const status = this.storeStatus();
    const icons = {
      'no-store': 'storefront',
      'active': 'check_circle',
      'verified': 'verified',
      'suspended': 'pause_circle',
      'inactive': 'pause_circle'
    };
    return icons[status] || 'storefront';
  });

  onManageStore(storeId: string): void {
    this.manageStore.emit(storeId);
  }

  onCreateStore(): void {
    this.createStore.emit();
  }

  onVerifyStore(): void {
    this.verifyStore.emit();
  }

  onAddProduct(): void {
    this.addProduct.emit();
  }

  onExportData(): void {
    this.exportData.emit();
  }

  onDuplicateStore(): void {
    this.duplicateStore.emit();
  }

  onArchiveStore(): void {
    this.archiveStore.emit();
  }

  trackByStoreId(index: number, store: Store): string {
    return store._id!;
  }

 copyStoreLink(storeLink: string) {
    const fullLink = `https://marketspase.com/store/${storeLink}`;

    navigator.clipboard.writeText(fullLink)
      .then(() => {
        this.snackBar.open('Store link copied successfully!', 'OK', { 
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'center'
        });
      })
      .catch(() => {
        this.snackBar.open('Failed to copy store link', 'OK', { 
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'center'
        });
      })
  }


}