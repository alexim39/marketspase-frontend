import { Component, inject, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { EngagementService } from '../engagement.service';
import { debounceTime, Subject } from 'rxjs';
import { ApiService } from '@shared/services/api';

@Component({
  selector: 'app-hire-promoters',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatTooltipModule, MatBadgeModule],
  templateUrl: './hire-promoters.component.html',
  styleUrls: ['./hire-promoters.component.scss']
})
export class HirePromotersComponent implements OnInit {
  private service = inject(EngagementService);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);

  promoters = signal<any[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hireDialogOpen = signal(false);
  selectedPromoter = signal<any>(null);
  submitting = signal(false);
  searchQuery = signal('');
  page = 1;
  totalPages = signal(1);
  total = signal(0);

  hireTasks = [{ type: 'like' as const, target: 10 }];
  hirePayment = 2000;
  hireSchedule = 'on-completion';
  hireTerms = '';

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(400)).subscribe(q => {
      this.searchQuery.set(q);
      this.page = 1;
      this.loadPromoters(true);
    });
    this.loadPromoters(true);
  }

  loadPromoters(reset: boolean = false): void {
    if (reset) { this.page = 1; this.loading.set(true); }
    else this.loadingMore.set(true);

    const params = new URLSearchParams();
    params.set('page', String(this.page));
    params.set('limit', '20');
    if (this.searchQuery()) params.set('search', this.searchQuery());

    this.api.get<any>(`api/v1/social/promoters?${params.toString()}`, undefined, undefined, true).subscribe({
      next: (r: any) => {
        this.promoters.set(reset ? (r?.data || []) : [...this.promoters(), ...(r?.data || [])]);
        this.totalPages.set(r?.pagination?.pages || 1);
        this.total.set(r?.pagination?.total || 0);
        this.loading.set(false);
        this.loadingMore.set(false);
        this.page++;
      },
      error: () => { this.loading.set(false); this.loadingMore.set(false); }
    });
  }

  onSearch(value: string): void {
    this.searchSubject.next(value);
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    if (this.loading() || this.loadingMore() || this.page > this.totalPages()) return;
    const pos = window.innerHeight + window.scrollY;
    const bottom = document.body.offsetHeight - 400;
    if (pos >= bottom) this.loadPromoters(false);
  }

  tierLabel(tier: string): string {
    const labels: Record<string, string> = { gold: 'Gold', silver: 'Silver', bronze: 'Bronze', unranked: 'New' };
    return labels[tier] || tier;
  }

  tierColor(tier: string): string {
    const colors: Record<string, string> = { gold: '#d97706', silver: '#6b7280', bronze: '#b45309', unranked: '#9ca3af' };
    return colors[tier] || '#9ca3af';
  }

  startHire(promoter: any): void {
    this.selectedPromoter.set(promoter);
    this.hireDialogOpen.set(true);
  }

  closeHire(): void {
    this.hireDialogOpen.set(false);
    this.hireTasks = [{ type: 'like', target: 10 }];
    this.hirePayment = 2000;
    this.hireSchedule = 'on-completion';
  }

  submitHire(): void {
    const promoter = this.selectedPromoter();
    if (!promoter) return;
    this.submitting.set(true);

    const milestones = this.hireSchedule === 'milestone'
      ? [{ percent: 50, description: '50% of tasks completed' }, { percent: 100, description: 'All tasks completed' }]
      : [];

    this.service.createContract({
      promoterId: promoter._id,
      tasks: this.hireTasks.map(t => ({ type: t.type, target: t.target })),
      payment: { total: this.hirePayment, schedule: this.hireSchedule, milestones },
      contractTerms: this.hireTerms
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.snack.open('Contract created! Promoter notified.', 'OK', { duration: 3000 });
        this.closeHire();
      },
      error: (e) => {
        this.submitting.set(false);
        this.snack.open(e?.error?.message || 'Failed to create contract', 'OK', { duration: 3000 });
      }
    });
  }
}
