import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';
import { take } from 'rxjs';
import { ApiService } from '@shared/services/api';

interface CollectionItem {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  productCount: number;
  viewCount: number;
  shareCount: number;
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-collections-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatRippleModule,
  ],
  templateUrl: './collections-list.component.html',
  styleUrls: ['./collections-list.component.scss'],
})
export class CollectionsListComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

  collections = signal<CollectionItem[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadCollections();
  }

  loadCollections(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.get<any>('api/v1/stores/promoter/collections')
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.collections.set(response?.data ?? response ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load collections. Please try again.');
          this.loading.set(false);
        }
      });
  }

  navigateToCreate(): void {
    this.router.navigate(['dashboard/stores/collections/create']);
  }

  navigateToDetail(collection: CollectionItem): void {
    this.router.navigate(['dashboard/stores/collections', collection._id]);
  }

  handleCoverError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/collection-placeholder.svg';
    img.onerror = null;
  }

  trackByCollectionId(_index: number, item: CollectionItem): string {
    return item._id;
  }
}
