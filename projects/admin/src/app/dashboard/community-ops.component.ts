import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AdminLiveActivityResponse, DashboardService } from './dashboard.service';

@Component({
  selector: 'app-community-ops',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatProgressBarModule],
  templateUrl: './community-ops.component.html',
  styleUrls: ['./community-ops.component.scss'],
})
export class CommunityOpsComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly activity = signal<AdminLiveActivityResponse | null>(null);

  readonly quickDestinations = [
    { title: 'Post management', route: '/dashboard/posts', icon: 'post_add' },
    { title: 'Campaign moderation', route: '/dashboard/campaigns', icon: 'campaign' },
    { title: 'Promotion fraud monitor', route: '/dashboard/promotions/fraud', icon: 'shield' },
    { title: 'Store management', route: '/dashboard/stores', icon: 'storefront' },
    { title: 'Testimonials', route: '/dashboard/testimonials', icon: 'reviews' },
  ];

  constructor() {
    this.load();
  }

  refresh(): void {
    this.dashboardService.clearCacheForKey('admin_live_activity_25');
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.dashboardService.getLiveActivity(25)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (data) => this.activity.set(data),
        error: (error) => {
          console.error('Failed to load admin community operations feed:', error);
          this.activity.set(null);
        },
      });
  }
}

