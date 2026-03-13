// components/store-header/store-header.component.ts
import { Component, input, output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '../../../models/store.model';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogService, TruncatePipe } from '../../../shared';
import { DeviceService, UserInterface } from '../../../../../../../shared-services/src/public-api';
import { take } from 'rxjs/internal/operators/take';
import { StoreService } from '../../../services/store.service';

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
    TruncatePipe
  ],
  providers: [StoreService, DialogService],
  templateUrl: './store-header.component.html',
  styleUrls: ['./store-header.component.scss']
})
export class StoreHeaderComponent {
  // Inputs
  store = input<Store | null>(null);
  user = input<UserInterface | null>(null);
  stores = input<Store[]>([]);
  loading = input<boolean>(false); 
  private snackBar = inject(MatSnackBar);
  private dialogService = inject(DialogService);
  private storeService = inject(StoreService);
  private router = inject(Router);


  private readonly deviceService = inject(DeviceService);
  protected readonly deviceType = computed(() => this.deviceService.type());

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

  async onDeleteStore(store: Store): Promise<void> {
    if (!store || !this.user()?._id) return;

    //console.log('Deleting store:', store);

    this.storeService.setLoading(true);

    const confirmed = await this.dialogService.confirmDelete(store.name, 'store').pipe(take(1)).toPromise();

    if (confirmed) {
      try {
        this.storeService.setLoading(true);
        
        this.storeService.permanentDeleteStore(store?._id ?? '', this.user()?._id ?? '').subscribe({
          next: (response) => {
            this.snackBar.open(
              `Store "${store.name}" deleted successfully.`,
              'OK',
              { 
                duration: 5000,
                panelClass: ['success-snackbar']
              }
            );
            this.refresh();
          },
          error: (error) => {
            console.error('Failed to delete store:', error);
            
            let errorMessage = 'Failed to delete store';
            if (error.status === 400) {
              errorMessage = error.error?.message || 'Cannot delete your only store';
            } else if (error.status === 403) {
              errorMessage = 'You do not have permission to delete this store';
            } else if (error.status === 404) {
              errorMessage = 'Store not found';
            }
            
            this.snackBar.open(errorMessage, 'OK', { 
              duration: 5000,
              panelClass: ['error-snackbar']
            });
            this.storeService.setLoading(false);
          }
        });
      } catch (error) {
        console.error('Delete confirmation error:', error);
        this.storeService.setLoading(false);
      }
    }
  }

  refresh() {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/dashboard/stores', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
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