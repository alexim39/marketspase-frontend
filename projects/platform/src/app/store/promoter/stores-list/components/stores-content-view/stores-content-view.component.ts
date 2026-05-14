// stores-content-view.component.ts
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Store } from '../../stores-list.service';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-stores-content-view',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatPaginatorModule, MatButtonModule],
  templateUrl: './stores-content-view.component.html',
  styleUrls: ['./stores-content-view.component.scss']
})
export class StoresContentViewComponent {
  @Input() stores: Store[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() totalStores = 0;
  @Input() totalPages = 0;
  @Input() currentPage = 1;
  @Input() pageSize = 12;
  @Input() deviceType: string = 'desktop';
  private router = inject(Router);
  
  @Output() viewStore = new EventEmitter<Store>();
  @Output() followStore = new EventEmitter<Store>();
  @Output() retry = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event.pageIndex + 1);
    if (event.pageSize !== this.pageSize) {
      this.pageSizeChange.emit(event.pageSize);
    }
  }

  visitStore(store: Store, type: 'products' | 'store' = 'store'): void {
    const baseUrl = `https://marketspase.com/store/${store.storeLink}`;
    const url = type === 'products' ? `${baseUrl}/products` : baseUrl;
    window.open(url, '_blank');
  }

  browseProducts(store: Store): void {
    this.router.navigate(['/dashboard/stores/store', store._id, 'products']);
  }
}