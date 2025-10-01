import { Component, OnInit, signal, computed, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './testimonial.component.html',
  styleUrl: './testimonial.component.scss',
})
export class TestimonialMgtComponent implements OnInit {
  private testimonialService = inject(TestimonialService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // State with signals
  testimonials = signal<Testimonial[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');
  statusFilter = signal('all');
  ratingFilter = signal('all');
  
  // Table data source
  dataSource = new MatTableDataSource<Testimonial>([]);
  displayedColumns: string[] = ['user', 'message', 'rating', 'status', 'reactions', 'date', 'actions'];
  
  // Pagination
  pageSize = signal(10);
  pageIndex = signal(0);
  totalTestimonials = signal(0);
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Computed values
  filteredTestimonials = computed(() => {
    let filtered = this.testimonials();
    
    // Apply search filter
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(testimonial => 
        testimonial.message.toLowerCase().includes(query) ||
        testimonial.user.name.toLowerCase().includes(query) ||
        testimonial.user.username.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (this.statusFilter() !== 'all') {
      filtered = filtered.filter(testimonial => testimonial.status === this.statusFilter());
    }
    
    // Apply rating filter
    if (this.ratingFilter() !== 'all') {
      filtered = filtered.filter(testimonial => testimonial.rating === parseInt(this.ratingFilter()));
    }
    
    return filtered;
  });

  ngOnInit(): void {
    this.loadTestimonials();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  async loadTestimonials(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.testimonialService.getTestimonials().subscribe({
        next: (testimonials) => {
          console.log('testimonials ',testimonials)
          this.testimonials.set(testimonials.data || []);
          this.applyFilters();
          this.isLoading.set(false);
        }
      });

    } catch (error) {
      console.error('Error loading testimonials:', error);
      this.isLoading.set(false);
      this.showSnackbar('Failed to load testimonials', 'error');
    }
  }

  applyFilters(): void {
    const filtered = this.filteredTestimonials();
    this.dataSource.data = filtered;
    this.totalTestimonials.set(filtered.length);
    
    // Reset paginator to first page
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.pageIndex.set(0);
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.applyFilters();
  }

  onStatusFilterChange(event: any): void {
    this.statusFilter.set(event.value);
    this.applyFilters();
  }

  onRatingFilterChange(event: any): void {
    this.ratingFilter.set(event.value);
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  approveTestimonial(testimonial: Testimonial): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Approve Testimonial',
        message: 'Are you sure you want to approve this testimonial? It will be visible to all users.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.testimonialService.updateTestimonialStatus(testimonial._id, 'approved')
          .subscribe({
            next: (updatedTestimonial) => {
              // Update the testimonial in our data
              const index = this.testimonials().findIndex(t => t._id === testimonial._id);
              if (index !== -1) {
                const updatedTestimonials = [...this.testimonials()];
                updatedTestimonials[index] = updatedTestimonial;
                this.testimonials.set(updatedTestimonials);
                this.applyFilters();
                this.showSnackbar('Testimonial approved successfully', 'success');
              }
            },
            error: (error) => {
              console.error('Error approving testimonial:', error);
              this.showSnackbar('Failed to approve testimonial', 'error');
            }
          });
      }
    });
  }

  rejectTestimonial(testimonial: Testimonial): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Reject Testimonial',
        message: 'Are you sure you want to reject this testimonial?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.testimonialService.updateTestimonialStatus(testimonial._id, 'rejected')
          .subscribe({
            next: (updatedTestimonial) => {
              // Update the testimonial in our data
              const index = this.testimonials().findIndex(t => t._id === testimonial._id);
              if (index !== -1) {
                const updatedTestimonials = [...this.testimonials()];
                updatedTestimonials[index] = updatedTestimonial;
                this.testimonials.set(updatedTestimonials);
                this.applyFilters();
                this.showSnackbar('Testimonial rejected successfully', 'success');
              }
            },
            error: (error) => {
              console.error('Error rejecting testimonial:', error);
              this.showSnackbar('Failed to reject testimonial', 'error');
            }
          });
      }
    });
  }

  toggleFeatured(testimonial: Testimonial): void {
    this.testimonialService.toggleFeatured(testimonial._id, !testimonial.isFeatured)
      .subscribe({
        next: (updatedTestimonial) => {
          // Update the testimonial in our data
          const index = this.testimonials().findIndex(t => t._id === testimonial._id);
          if (index !== -1) {
            const updatedTestimonials = [...this.testimonials()];
            updatedTestimonials[index] = updatedTestimonial;
            this.testimonials.set(updatedTestimonials);
            this.applyFilters();
            const message = updatedTestimonial.isFeatured 
              ? 'Testimonial featured successfully' 
              : 'Testimonial unfeatured successfully';
            this.showSnackbar(message, 'success');
          }
        },
        error: (error) => {
          console.error('Error toggling featured status:', error);
          this.showSnackbar('Failed to update featured status', 'error');
        }
      });
  }

  viewDetails(testimonial: Testimonial): void {
    this.dialog.open(TestimonialDetailDialogComponent, {
      width: '600px',
      data: { testimonial }
    });
  }

  deleteTestimonial(testimonial: Testimonial): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Testimonial',
        message: 'Are you sure you want to delete this testimonial? This action cannot be undone.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.testimonialService.deleteTestimonial(testimonial._id)
          .subscribe({
            next: () => {
              // Remove from local array
              const updatedTestimonials = this.testimonials().filter(t => t._id !== testimonial._id);
              this.testimonials.set(updatedTestimonials);
              this.applyFilters();
              this.showSnackbar('Testimonial deleted successfully', 'success');
            },
            error: (error) => {
              console.error('Error deleting testimonial:', error);
              this.showSnackbar('Failed to delete testimonial', 'error');
            }
          });
      }
    });
  }

  private showSnackbar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error'
    });
  }
}