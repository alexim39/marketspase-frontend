import { Component, inject, OnInit, OnDestroy, ViewChild, signal, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, Subscription, takeUntil } from 'rxjs';

// Angular Material imports
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import {MatProgressBarModule} from '@angular/material/progress-bar';
// Services
import { CampaignService } from './campaign.service';
import { Router } from '@angular/router';
import { AdminService } from '../common/services/user.service';
import { CampaignInterface } from '../../../../shared-services/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface ActivityLog {
  action: string;
  timestamp: string;
  details: string;
}

@Component({
  selector: 'admin-campaign-mgt',
  standalone: true,
  providers: [CampaignService, DatePipe, CurrencyPipe],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Material Modules
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatMenuModule,
    MatBadgeModule,
    MatProgressBarModule
  ],
  templateUrl: './campaign.component.html',
  styleUrls: ['./campaign.component.scss'],
})
export class CampaignMgtComponent implements OnInit, OnDestroy {
  readonly adminService = inject(AdminService);
  readonly campaignService = inject(CampaignService);
  readonly router = inject(Router);
  readonly snackBar = inject(MatSnackBar);
  readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // Signals for state management
  isLoading = signal(true);
  totalCampaigns = signal(0);
  activeCampaigns = signal(0);
  pendingCampaigns = signal(0);
  completedCampaigns = signal(0);
  rejectedCampaigns = signal(0);
  categories = signal<string[]>([]);

  // Table properties
  displayedColumns: string[] = ['title', 'owner', 'budget', 'promoters', 'status', 'dates', 'actions'];
  dataSource: MatTableDataSource<CampaignInterface> = new MatTableDataSource<CampaignInterface>([]);

  // Filters form
  filtersForm = this.fb.group({
    status: [[]],
    category: [[]],
    search: ['']
  });

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    // Initialize the data source with the correct filter predicate
    this.dataSource.filterPredicate = this.createFilter();
  }

  ngOnInit(): void {
    this.adminService.fetchAdmin();
    this.loadCampaigns();

    // Subscribe to filter changes
      this.filtersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.applyFormFilters();
      })
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadCampaigns(): void {
    this.isLoading.set(true);
    
      this.campaignService.getAppCampaigns()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.dataSource.data = response.data;
            this.calculateStats(response.data);
            this.extractCategories(response.data);
            this.isLoading.set(false);
          } else {
            //console.error('Failed to fetch campaigns:', response.message);
            this.snackBar.open('Failed to load campaigns', 'Close', { duration: 3000 });
            this.isLoading.set(false);
          }
        },
        error: (error) => {
          //console.error('Error fetching campaigns:', error);
          this.snackBar.open('Error loading campaigns', 'Close', { duration: 3000 });
          this.isLoading.set(false);
        }
      })
  }

  calculateStats(campaigns: CampaignInterface[]): void {
    this.totalCampaigns.set(campaigns.length);
    this.activeCampaigns.set(campaigns.filter(c => c.status === 'active').length);
    this.pendingCampaigns.set(campaigns.filter(c => c.status === 'pending').length);
    this.rejectedCampaigns.set(campaigns.filter(c => c.status === 'rejected').length);
    this.completedCampaigns.set(
      campaigns.filter(c => ['completed', 'exhausted', 'expired', 'rejected'].includes(c.status)).length
    );
  }

  extractCategories(campaigns: CampaignInterface[]): void {
    const categories = new Set(campaigns.map(c => c.category).filter(Boolean));
    this.categories.set(Array.from(categories) as string[]);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filtersForm.patchValue({ search: filterValue });
  }

  applyFormFilters() {
    const filters = this.filtersForm.value;
    this.dataSource.filter = JSON.stringify(filters);
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  createFilter(): (data: CampaignInterface, filter: string) => boolean {
    return (data: CampaignInterface, filter: string): boolean => {
      // If the filter is empty, return true for all items
      if (!filter) return true;
      
      const filters = JSON.parse(filter);
      const searchTerm = filters.search?.toLowerCase() || '';
      
      // Check search term
      const matchesSearch = searchTerm === '' || 
        data.title.toLowerCase().includes(searchTerm) ||
        data.owner.displayName.toLowerCase().includes(searchTerm) ||
        data.owner.email.toLowerCase().includes(searchTerm) ||
        data.category?.toLowerCase().includes(searchTerm);
      
      // Check status filter
      const matchesStatus = filters.status.length === 0 || filters.status.includes(data.status);
      
      // Check category filter
      const matchesCategory = filters.category.length === 0 || 
        (data.category && filters.category.includes(data.category));
      
      return matchesSearch && matchesStatus && matchesCategory;
    };
  }

  clearFilters(): void {
    this.filtersForm.reset({
      status: null,
      category: null,
      search: ''
    });
  }

  viewCampaignDetails(campaign: CampaignInterface): void {
    this.router.navigate(['dashboard/campaigns', campaign._id]);
  }

  viewPromotions(campaign: CampaignInterface): void {
    this.router.navigate(['dashboard/campaigns', campaign._id, 'promotions']);
  }

  viewActivityLog(campaign: CampaignInterface): void {
    this.router.navigate(['dashboard/campaigns', campaign._id, 'activity']);
  }

  approveCampaign(campaign: CampaignInterface): void {
      this.campaignService.updateCampaignStatus(campaign._id, 'active', this.adminService.adminData()?._id || '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Campaign approved successfully', 'Close', { duration: 3000 });
            this.loadCampaigns();
          } else {
            this.snackBar.open('Failed to approve campaign', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error approving campaign:', error);
          this.snackBar.open('Error approving campaign', 'Close', { duration: 3000 });
        }
      })
  }

  rejectCampaign(campaign: CampaignInterface): void {
      this.campaignService.updateCampaignStatus(campaign._id, 'rejected', this.adminService.adminData()?._id || '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Campaign rejected successfully', 'Close', { duration: 3000 });
            this.loadCampaigns();
          } else {
            this.snackBar.open('Failed to reject campaign', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error rejecting campaign:', error);
          this.snackBar.open('Error rejecting campaign', 'Close', { duration: 3000 });
        }
      })
  }

  pauseCampaign(campaign: CampaignInterface): void {
      this.campaignService.updateCampaignStatus(campaign._id, 'paused', this.adminService.adminData()?._id || '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Campaign paused successfully', 'Close', { duration: 3000 });
            this.loadCampaigns();
          } else {
            this.snackBar.open('Failed to pause campaign', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error pausing campaign:', error);
          this.snackBar.open('Error pausing campaign', 'Close', { duration: 3000 });
        }
      })
  }

  resumeCampaign(campaign: CampaignInterface): void {
      this.campaignService.updateCampaignStatus(campaign._id, 'active', this.adminService.adminData()?._id || '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Campaign resumed successfully', 'Close', { duration: 3000 });
            this.loadCampaigns();
          } else {
            this.snackBar.open('Failed to resume campaign', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error resuming campaign:', error);
          this.snackBar.open('Error resuming campaign', 'Close', { duration: 3000 });
        }
      })
  }

 
  ngOnDestroy(): void {
    // this.destroy$.next();
    // this.destroy$.complete();
  }

}