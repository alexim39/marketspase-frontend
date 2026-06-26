import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { take } from 'rxjs';
import { ApiService, CurrencyUtilsPipe } from '@shared/services';

interface CollectionDetail {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  coverImage?: string;
  productCount: number;
  viewCount: number;
  shareCount: number;
  products: CollectionProduct[];
  createdAt?: string;
  updatedAt?: string;
}

interface CollectionProduct {
  _id: string;
  name: string;
  price: number;
  currency: string;
  images?: Array<{ url: string; thumbnail?: string }>;
  store?: {
    _id: string;
    name: string;
  };
}

@Component({
  selector: 'app-collections-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    CurrencyUtilsPipe,
  ],
  templateUrl: './collections-detail.component.html',
  styleUrls: ['./collections-detail.component.scss'],
})
export class CollectionsDetailComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private clipboard = inject(Clipboard);
  private dialog = inject(MatDialog);

  collection = signal<CollectionDetail | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  removingProductId = signal<string | null>(null);

  collectionId: string = '';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.collectionId = params['id'];
      this.loadCollection();
    });
  }

  loadCollection(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.get<any>(`api/v1/stores/promoter/collections/${this.collectionId}`)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.collection.set(response?.data ?? response);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load collection.');
          this.loading.set(false);
        }
      });
  }

  removeProduct(product: CollectionProduct): void {
    this.removingProductId.set(product._id);
    const updatedProducts = this.collection()!.products.filter(p => p._id !== product._id);
    const payload = { products: updatedProducts.map(p => ({ productId: p._id })) };

    this.apiService.put<any>(
      `api/v1/stores/promoter/collections/${this.collectionId}/products`, payload
    ).pipe(take(1)).subscribe({
      next: () => {
        this.collection.update(c => {
          if (!c) return c;
          return { ...c, products: updatedProducts, productCount: updatedProducts.length };
        });
        this.removingProductId.set(null);
        this.snackBar.open('Product removed from collection', 'OK', { duration: 3000 });
      },
      error: () => {
        this.removingProductId.set(null);
        this.snackBar.open('Failed to remove product', 'OK', { duration: 5000 });
      }
    });
  }

  copyPublicUrl(): void {
    const slug = this.collection()?.slug;
    if (!slug) return;

    const publicUrl = `${window.location.origin}/collections/${slug}`;
    const copied = this.clipboard.copy(publicUrl);

    if (copied) {
      this.snackBar.open('Public URL copied to clipboard', 'OK', {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
    }
  }

  goBack(): void {
    this.router.navigate(['dashboard/stores/collections']);
  }

  handleProductImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/product-placeholder.jpg';
    img.onerror = null;
  }
}
