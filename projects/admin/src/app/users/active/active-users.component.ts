import { Component, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { interval, Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../../../shared-services/src/public-api';

@Component({
  selector: 'app-active-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressBarModule, MatSnackBarModule],
  templateUrl: './active-users.component.html',
  styleUrls: ['./active-users.component.scss'],
})
export class ActiveUsersComponent {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  readonly isLoading = signal(true);
  readonly users = signal<any[]>([]);
  readonly onlineCount = signal({ total: 0, marketers: 0, promoters: 0 });

  readonly searchFilter = signal('');
  readonly roleFilter = signal('all');
  readonly minutesFilter = signal(10);

  readonly currentPage = signal(1);
  readonly pageSize = signal(25);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly pageSizeOptions = [25, 50, 100];

  readonly pageNumbers = computed(() => {
    const t = Math.max(1, this.totalPages()), c = this.currentPage();
    const pages: number[] = []; const s = Math.max(1, c - 2); const e = Math.min(t, c + 2);
    for (let i = s; i <= e; i++) pages.push(i);
    return pages;
  });

  constructor() {
    this.loadUsers();
    this.searchSubject.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef)).subscribe(() => { this.currentPage.set(1); this.loadUsers(); });
    interval(30000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadUsers());
  }

  loadUsers(): void {
    this.isLoading.set(true);
    let httpParams = new HttpParams()
      .set('page', this.currentPage())
      .set('limit', this.pageSize())
      .set('withinMinutes', this.minutesFilter());
    if (this.roleFilter() !== 'all') httpParams = httpParams.set('role', this.roleFilter());
    if (this.searchFilter().trim()) httpParams = httpParams.set('search', this.searchFilter().trim());

    this.api.get<any>('api/v1/user/admin/users/active', httpParams).subscribe({
      next: (r) => {
        if (r.success) {
          this.users.set(r.data || []);
          this.totalItems.set(r.pagination?.total || 0);
          this.totalPages.set(r.pagination?.pages || 1);
          this.onlineCount.set(r.count || { total: 0, marketers: 0, promoters: 0 });
        }
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); this.snackBar.open('Failed to load users', 'Close', { duration: 3000 }); },
    });
  }

  onSearchChange(v: string): void { this.searchFilter.set(v); this.searchSubject.next(v); }
  onRoleChange(v: string): void { this.roleFilter.set(v); this.currentPage.set(1); this.loadUsers(); }
  onMinutesChange(v: number): void { this.minutesFilter.set(v); this.currentPage.set(1); this.loadUsers(); }

  goToPage(page: number): void { const t = Math.max(1, Math.min(page, this.totalPages())); if (t === this.currentPage()) return; this.currentPage.set(t); this.loadUsers(); }
  onPageInput(e: Event): void { const i = e.target as HTMLInputElement; const p = parseInt(i.value, 10); if (!isNaN(p) && p >= 1 && p <= this.totalPages()) this.goToPage(p); i.value = ''; }
  onPageSizeChange(size: string | number): void { const n = typeof size === 'string' ? parseInt(size, 10) : size; this.pageSize.set(n); this.currentPage.set(1); this.loadUsers(); }

  getTimeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  }

  getOnlineDot(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins <= 2) return 'dot-active';
    if (mins <= 5) return 'dot-recent';
    if (mins <= 10) return 'dot-idle';
    return 'dot-away';
  }
}
