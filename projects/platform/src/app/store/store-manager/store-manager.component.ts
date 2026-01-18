import { Component, inject, signal, Input  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'; // Add MAT_DIALOG_DATA
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StoreService } from '../services/store.service';
import { Store } from '../models/store.model';
import { Router } from '@angular/router';


@Component({
  selector: 'app-store-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule
  ],
  template: `
    <div class="store-manager">
      <div class="manager-header">
        <h2>Manage Stores</h2>
        <button mat-icon-button (click)="dialogRef.close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Add loading indicator -->
      <!-- @if (loading()) {
        <div class="loading-indicator">
          <mat-icon class="spinner">refresh</mat-icon>
          <p>Loading stores...</p>
        </div>
      } -->
      
      <div class="stores-list">
        @for (store of stores; track store._id) {
          <mat-card [class.default-store]="store.isDefaultStore">
            <mat-card-content>
              <div class="store-card">
                <div class="store-info">
                  <div class="store-icon">
                    <mat-icon>storefront</mat-icon>
                  </div>
                  <div class="store-details">
                    <h3>{{ store.name }}</h3>
                    <p class="store-description">{{ store.description || 'No description' }}</p>
                    <div class="store-tags">
                      <span class="tag verified" *ngIf="store.isVerified">
                        <mat-icon>verified</mat-icon>
                        Verified
                      </span>
                      <span class="tag default" *ngIf="store.isDefaultStore">
                        <mat-icon>star</mat-icon>
                        Default Store
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="store-actions">
                  @if (!store.isDefaultStore) {
                    <button mat-button color="primary" (click)="setAsDefault(store)">
                      <mat-icon>star_outline</mat-icon>
                      Set as Default
                    </button>
                  }
                  <button mat-button [matMenuTriggerFor]="storeMenu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  
                  <mat-menu #storeMenu="matMenu">
                    <button mat-menu-item (click)="viewStore(store)">
                      <mat-icon>visibility</mat-icon>
                      View Store
                    </button>
                    <button mat-menu-item (click)="editStore(store)">
                      <mat-icon>edit</mat-icon>
                      Edit Store
                    </button>
                    <button mat-menu-item (click)="archiveStore(store)" class="warn">
                      <mat-icon>archive</mat-icon>
                      Archive Store
                    </button>
                  </mat-menu>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        }
        
        @if (stores.length === 0) {
          <div class="empty-stores">
            <mat-icon>storefront</mat-icon>
            <p>No stores created yet</p>
          </div>
        }
      </div>
      
      <div class="manager-actions">
        <button mat-stroked-button (click)="createNewStore()">
          <mat-icon>add_business</mat-icon>
          Create New Store
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./store-manager.component.scss']
})
export class StoreManagerComponent {
  private storeService = inject(StoreService);
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<StoreManagerComponent>);
  private dialogData = inject(MAT_DIALOG_DATA); // Inject the dialog data
  private router = inject(Router);
  
  // Remove @Input() decorator since we're using dialog data instead
  stores: Store[] = [];
  storesSignal = signal<Store[]>([]);
  
 ngOnInit() {
    // Use the dialog data passed from parent
    this.stores = this.dialogData?.stores.data || [];
    this.loadStores();
  }
  
  loadStores() {
    // Get stores from dialog data
    this.storesSignal.set(this.stores);
  }
  
  setAsDefault(store: Store) {
    this.storeService.setDefaultStore(store!).subscribe({
        next: (updatedStore) => {
            console.log('returned messge ', updatedStore)
            this.snackBar.open(`${updatedStore.message}`, 'OK', { duration: 3000 });
            this.dialogRef.close(true);
        },
        error: (error) => {
            this.snackBar.open('Failed to set default store', 'OK', { duration: 3000 });
        }
    });
  }
  
  viewStore(store: Store) {
    this.storeService.setCurrentStore(store);
    this.dialogRef.close(true);
  }
  
  editStore(store: Store) {
    // Navigate to edit page
    this.dialogRef.close();
    // You'd implement navigation here
  }
  
  archiveStore(store: Store) {
    // Implement archive logic
  }
  
  createNewStore() {
    this.router.navigate(['/dashboard/stores/create']);
    this.dialogRef.close(true);
  }
}