import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@shared/services/api';

@Component({
  selector: 'app-service-list-management',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatTooltipModule, MatSnackBarModule, MatProgressSpinnerModule],
  templateUrl: './service-list-management.component.html',
  styleUrls: ['./service-list-management.component.scss'],
})
export class ServiceListManagementComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  readonly storeId = signal('');
  readonly store = signal<any>(null);
  readonly services = signal<any[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.storeId.set(this.route.snapshot.paramMap.get('storeId') || '');
    this.loadStore();
    this.loadServices();
  }

  loadStore(): void {
    this.api.get<any>(`api/v1/stores/store/${this.storeId()}`, undefined, undefined, true).subscribe({
      next: r => this.store.set(r?.data),
      error: () => null,
    });
  }

  loadServices(): void {
    this.loading.set(true);
    this.api.get<any>(`api/v1/stores/service/${this.storeId()}/list`, undefined, undefined, true).subscribe({
      next: r => { this.services.set(r?.data || []); this.loading.set(false); },
      error: () => { this.error.set('Failed to load services'); this.loading.set(false); },
    });
  }

  togglePublish(service: any): void {
    const isPublished = !service.isPublished;
    this.api.put<any>(`api/v1/stores/service/${this.storeId()}/${service._id}`, { isPublished }, undefined, true).subscribe({
      next: () => {
        this.services.update(list => list.map(s => s._id === service._id ? { ...s, isPublished } : s));
        this.snackBar.open(isPublished ? 'Published!' : 'Unpublished', 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('Failed to update', 'Close', { duration: 3000 }),
    });
  }

  pricingSummary(s: any): string {
    if (s.pricingType === 'fixed') return `₦${(s.price || 0).toLocaleString()}`;
    if (s.pricingType === 'hourly') return `₦${(s.hourlyRate || 0).toLocaleString()}/hr`;
    if (s.pricingType === 'package') return `${s.packages?.length || 0} packages`;
    return 'Custom quote';
  }

  get publishedCount(): number { return this.services().filter(s => s.isPublished).length; }
  get draftCount(): number { return this.services().filter(s => !s.isPublished).length; }
}
