import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TestimonialService } from './shared/testimonial.service';
import { Testimonial } from './shared/testimonial.model';
import { ConfirmationDialogComponent } from './shared/confirmation-dialog/confirmation-dialog.component';
import { TestimonialDetailDialogComponent } from './testimonial-detail-dialog/testimonial-detail-dialog.component';

@Component({
  selector: 'admin-testimonial-mgt',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatProgressBarModule
  ],
  templateUrl: './testimonial.component.html',
  styleUrl: './testimonial.component.scss',
})
export class TestimonialMgtComponent implements OnInit {
  private testimonialService = inject(TestimonialService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  readonly allTestimonials = signal<Testimonial[]>([]);
  readonly isLoading = signal(true);

  readonly searchQuery = signal('');
  readonly statusFilter = signal('all');
  readonly ratingFilter = signal('all');

  readonly currentPage = signal(1);
  readonly pageSize = signal(25);
  readonly pageSizeOptions = [10, 25, 50, 100];

  readonly filteredTestimonials = computed(() => {
    let filtered = this.allTestimonials();

    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(t =>
        t.message.toLowerCase().includes(query) ||
        t.user.name.toLowerCase().includes(query) ||
        t.user.username.toLowerCase().includes(query)
      );
    }

    if (this.statusFilter() !== 'all') {
      filtered = filtered.filter(t => t.status === this.statusFilter());
    }

    if (this.ratingFilter() !== 'all') {
      filtered = filtered.filter(t => t.rating === parseInt(this.ratingFilter()));
    }

    return filtered;
  });

  readonly totalFiltered = computed(() => this.filteredTestimonials().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalFiltered() / this.pageSize())));

  readonly displayedData = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredTestimonials().slice(start, start + this.pageSize());
  });

  readonly totalPending = computed(() => this.allTestimonials().filter(t => t.status === 'pending').length);
  readonly totalApproved = computed(() => this.allTestimonials().filter(t => t.status === 'approved').length);
  readonly totalRejected = computed(() => this.allTestimonials().filter(t => t.status === 'rejected').length);
  readonly totalFeatured = computed(() => this.allTestimonials().filter(t => t.isFeatured).length);

  readonly pageNumbers = computed(() => {
    const total = Math.max(1, this.totalPages());
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  ngOnInit(): void {
    this.loadTestimonials();
  }

  loadTestimonials(): void {
    this.isLoading.set(true);
    this.testimonialService.getTestimonials().subscribe({
      next: (response) => {
        this.allTestimonials.set(response.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.showSnackbar('Failed to load testimonials', 'error');
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  toggleStatusFilter(value: string): void {
    this.statusFilter.update(s => s === value ? 'all' : value);
    this.currentPage.set(1);
  }

  toggleRatingFilter(value: string): void {
    this.ratingFilter.update(r => r === value ? 'all' : value);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.ratingFilter.set('all');
    this.currentPage.set(1);
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  approveTestimonial(t: Testimonial): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { title: 'Approve Testimonial', message: 'Are you sure you want to approve this testimonial? It will be visible to all users.' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.testimonialService.updateTestimonialStatus(t._id, 'approved').subscribe({
          next: (updated) => {
            const updatedList = this.allTestimonials().map(item => item._id === t._id ? updated : item);
            this.allTestimonials.set(updatedList);
            this.showSnackbar('Testimonial approved', 'success');
          },
          error: () => this.showSnackbar('Failed to approve testimonial', 'error')
        });
      }
    });
  }

  rejectTestimonial(t: Testimonial): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { title: 'Reject Testimonial', message: 'Are you sure you want to reject this testimonial?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.testimonialService.updateTestimonialStatus(t._id, 'rejected').subscribe({
          next: (updated) => {
            const updatedList = this.allTestimonials().map(item => item._id === t._id ? updated : item);
            this.allTestimonials.set(updatedList);
            this.showSnackbar('Testimonial rejected', 'success');
          },
          error: () => this.showSnackbar('Failed to reject testimonial', 'error')
        });
      }
    });
  }

  toggleFeatured(t: Testimonial): void {
    this.testimonialService.toggleFeatured(t._id, !t.isFeatured).subscribe({
      next: (updated) => {
        const updatedList = this.allTestimonials().map(item => item._id === t._id ? updated : item);
        this.allTestimonials.set(updatedList);
        this.showSnackbar(updated.isFeatured ? 'Testimonial featured' : 'Testimonial unfeatured', 'success');
      },
      error: () => this.showSnackbar('Failed to update featured status', 'error')
    });
  }

  viewDetails(t: Testimonial): void {
    this.dialog.open(TestimonialDetailDialogComponent, {
      width: '600px',
      data: { testimonial: t }
    });
  }

  deleteTestimonial(t: Testimonial): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { title: 'Delete Testimonial', message: 'Are you sure you want to delete this testimonial? This action cannot be undone.' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.testimonialService.deleteTestimonial(t._id).subscribe({
          next: () => {
            this.allTestimonials.update(list => list.filter(item => item._id !== t._id));
            this.showSnackbar('Testimonial deleted', 'success');
          },
          error: () => this.showSnackbar('Failed to delete testimonial', 'error')
        });
      }
    });
  }

  onAvatarError(event: Event): void {
    (event.target as HTMLImageElement).src = '/img/avatar.png';
  }

  goToPage(page: number): void {
    const target = Math.max(1, Math.min(page, Math.max(1, this.totalPages())));
    if (target === this.currentPage()) return;
    this.currentPage.set(target);
  }

  onPageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const page = parseInt(input.value, 10);
    if (!isNaN(page) && page >= 1 && page <= this.totalPages()) this.goToPage(page);
    input.value = '';
  }

  onPageSizeChange(size: string | number): void {
    const parsed = typeof size === 'string' ? parseInt(size, 10) : size;
    this.pageSize.set(parsed);
    this.currentPage.set(1);
  }

  private showSnackbar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error'
    });
  }
}
