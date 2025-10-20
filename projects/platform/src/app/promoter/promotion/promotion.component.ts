import { Component, OnInit, inject, signal, computed, Signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DeviceService, PromotionInterface, UserInterface } from '../../../../../shared-services/src/public-api';
import { PromoterService } from '../../promoter/promoter.service';
import { UserService } from '../../common/services/user.service';

import { HeaderComponent } from './components/header/header.component';
import { StatsOverviewComponent } from './components/stats-overview/stats-overview.component';
import { PromotionCardComponent } from './components/promotion-card/promotion-card.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { LoadingStateComponent } from './components/loading-state/loading-state.component';
import { SubmitProofDialogComponent } from './submit-proof/submit-proof-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { StatsOverviewMobileComponent } from './components/stats-overview/mobile/stats-overview-mobile.component';

interface PromotionStats {
  total: number;
  pending: number;
  submitted: number;
  validated: number;
  paid: number;
  rejected: number;
}

@Component({
  selector: 'app-promotion',
  standalone: true,
  providers: [PromoterService],
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    HeaderComponent,
    StatsOverviewComponent,
    PromotionCardComponent,
    EmptyStateComponent,
    LoadingStateComponent,
    StatsOverviewMobileComponent
  ],
  templateUrl: './promotion.component.html',
  styleUrls: ['./promotion.component.scss'],
})
export class PromotionComponent implements OnInit {
  private promoterService = inject(PromoterService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  readonly dialog = inject(MatDialog);

  private userService: UserService = inject(UserService);
  public user: Signal<UserInterface | null> = this.userService.user;

  private deviceService = inject(DeviceService);
  deviceType = computed(() => this.deviceService.type());

  isLoading = signal<boolean>(true);
  promotions = signal<PromotionInterface[]>([]);
  stats = signal<PromotionStats>({
    total: 0,
    pending: 0,
    submitted: 0,
    validated: 0,
    paid: 0,
    rejected: 0,
  });

  selectedTab = signal<string>('all');

  // Computed signals to derive state from promotions signal
  filteredPromotions = computed(() => {
    const tab = this.selectedTab();
    if (tab === 'all') {
      return this.promotions();
    }
    return this.promotions().filter(p => p.status === tab);
  });

  isEmptyState = computed(() => this.filteredPromotions().length === 0 && !this.isLoading());

  ngOnInit(): void {
    this.loadUserPromotions();
  }

  loadUserPromotions(): void {
    this.isLoading.set(true);

    const userId = this.user()?._id;

    // Check if the user ID exists before making the API call
    if (!userId) {
      this.snackBar.open('User not logged in or ID not available.', 'Dismiss', { duration: 3000 });
      this.isLoading.set(false);
      return;
    }

    this.promoterService.getUserPromotions(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          //console.log('response ',response)
          // Add a defensive check for the response data
          if (response && response.data) {
            //console.log('returned promotions',response.data)
            this.promotions.set(response.data);
            this.stats.set(this.calculateStats(response.data));
          } else {
            // Handle case where response is not as expected
            this.promotions.set([]);
            this.stats.set(this.calculateStats([]));
            console.warn('API response was malformed or empty.');
          }
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load promotions:', error);
          //this.snackBar.open('Failed to load promotions. Please try again.', 'Dismiss', { duration: 3000 });
          this.isLoading.set(false);
        }
      });
  }

  private calculateStats(promotions: PromotionInterface[]): PromotionStats {
    // Ensure promotions is always an array to prevent TypeError
    const promos = promotions || [];
    return promos.reduce((acc, promo) => {
      acc.total++;
      if (promo.status) {
        acc[promo.status as keyof PromotionStats] = (acc[promo.status as keyof PromotionStats] as number) + 1;
      }
      return acc;
    }, { total: 0, pending: 0, submitted: 0, validated: 0, paid: 0, rejected: 0 });
  }

  onTabChange(tab: string): void {
    this.selectedTab.set(tab);
  }

  openSubmitProofDialog(promotion: PromotionInterface): void {
    // Dialog logic remains here

     const dialogRef = this.dialog.open(SubmitProofDialogComponent, {
      data: { promotion: promotion } // Wrap the promotion object in the expected data structure
    });

    // Handle the dialog result
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'submitted') {
        // Update the specific promotion's status to 'submitted'
        this.promotions.update(promotions => 
          promotions.map(p => 
            p._id === promotion._id 
              ? { ...p, status: 'submitted' as any } 
              : p
          )
        );
        
        // Recalculate stats with the updated promotions
        this.stats.set(this.calculateStats(this.promotions()));
        
        // Show success message
        //this.snackBar.open('Proof submitted successfully!', 'Dismiss', { duration: 3000 });
      }
    });
  }


}