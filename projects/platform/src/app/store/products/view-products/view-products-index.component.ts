// products.component.ts - Main page component
import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '../../models/store.model';
import { Product } from '../../models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProductManagementComponent } from './product-management.component';
import { MatIconModule } from '@angular/material/icon';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-products',
  standalone: true,
  providers: [StoreService],
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ProductManagementComponent,
    MatIconModule
  ],
  template: `
    <div class="products-page">
      @if (loading()) {
        <div class="loading-spinner">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading products...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <h3>Failed to load products</h3>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="loadProducts()">
            Retry
          </button>
        </div>
      } @else {
        <app-product-management
          [store]="store()!"
          [products]="products()"
          (productUpdated)="loadProducts()"
          (pageChanged)="onPageChange($event)"
        ></app-product-management>
        <!-- <app-product-management
          [store]="store()!"
          [products]="products()"
          [paginationData]="paginationData()"
          (productUpdated)="loadProducts()"
          (pageChanged)="onPageChange($event)"
        ></app-product-management> -->
      }
    </div>
  `,
  styleUrls: ['./view-products-index.component.scss']
})
export class ProductsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private storeService = inject(StoreService);
  
  private destroy$ = new Subject<void>();
  
  store = signal<Store | null>(null);
  products = signal<Product[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  paginationData = signal<any>(null);
  currentPage = signal<number>(1);
  limit = signal<number>(20);
  
  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const storeId = params.get('storeId');
      if (storeId) {
        this.loadProducts(storeId);
      } else {
        this.error.set('Store ID not found');
        this.loading.set(false);
      }
    });
  }
  
  loadProducts(storeId?: string, page: number = 1): void {
    const targetStoreId = storeId || this.route.snapshot.paramMap.get('storeId');
    if (!targetStoreId) return;
    
    this.loading.set(true);
    this.error.set(null);
    this.currentPage.set(page);
    
    this.storeService.getStoreProducts(targetStoreId, page, this.limit()).subscribe({
      next: (response) => {
        //console.log('Returned response:', response);
        
        if (response.success && response.data) {
          // Update store information
          this.store.set({
            _id: targetStoreId,
            name: 'Store Products',
            owner: '',
            isVerified: false,
            isDefaultStore: false,
            verificationTier: 'basic'
          } as Store);
          
          // Set products from response.data.products
          this.products.set(response.data.products || []);
          
          // Set pagination data
          this.paginationData.set({
            total: response.data.total || 0,
            page: response.data.page || 1,
            limit: response.data.limit || 20,
            totalPages: response.data.totalPages || 1,
            hasNextPage: response.data.hasNextPage || false,
            hasPrevPage: response.data.hasPrevPage || false
          });
          
          this.loading.set(false);
          
          if (response.data.products.length === 0) {
            this.snackBar.open('No products found for this store', 'OK', { 
              duration: 3000 
            });
          }
        } else {
          this.error.set('Invalid response format');
          this.loading.set(false);
          this.snackBar.open('Invalid data received from server', 'OK', { 
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.error.set(error.message || 'Failed to load products. Please try again.');
        this.loading.set(false);
        this.snackBar.open('Failed to load products', 'OK', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
  
  onPageChange(e: any): void {
    const page = e.target.value;
    const storeId = this.route.snapshot.paramMap.get('storeId');
    if (storeId) {
      this.loadProducts(storeId, page);
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}