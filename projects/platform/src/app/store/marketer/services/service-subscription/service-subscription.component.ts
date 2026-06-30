import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '@shared/services/api';
import { Router, ActivatedRoute } from '@angular/router';

const TIERS = [
  { id: 'free', name: 'Free', price: 0, icon: 'storefront', desc: 'Your services appear only on your store page. No monthly cost.', features: ['Store page listing', 'Unlimited services', 'Inquiry management'] },
  { id: 'basic', name: 'Basic', price: 5000, icon: 'search', desc: 'Services appear in category search. Reach more customers.', features: ['Everything in Free', 'Category search visibility', 'Promoter discovery', 'Lead notifications'] },
  { id: 'pro', name: 'Pro', price: 15000, icon: 'rocket_launch', desc: 'Featured placement. Maximum visibility for your services.', features: ['Everything in Basic', 'Featured placement', 'Priority search ranking', 'AI lead qualification', 'Priority support'] },
];

@Component({
  selector: 'app-service-subscription',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="subscription-page">
      <header class="page-header">
        <button mat-icon-button (click)="router.navigate(['/dashboard/stores'])"><mat-icon>arrow_back</mat-icon></button>
        <div><h1>Choose Your Plan</h1><p>Select how visible you want your services to be. You can change this anytime.</p></div>
      </header>

      <div class="tier-grid">
        @for (tier of TIERS; track tier.id) {
          <mat-card class="tier-card" [class.selected]="selectedTier() === tier.id" (click)="selectedTier.set(tier.id)" appearance="outlined">
            <div class="tier-header">
              <mat-icon class="tier-icon">{{ tier.icon }}</mat-icon>
              <div>
                <h2>{{ tier.name }}</h2>
                <span class="tier-price">₦{{ tier.price.toLocaleString() }}/mo</span>
              </div>
              @if (selectedTier() === tier.id) { <mat-icon class="check-icon">check_circle</mat-icon> }
            </div>
            <p class="tier-desc">{{ tier.desc }}</p>
            <div class="tier-features">
              @for (f of tier.features; track f) { <div class="feature"><mat-icon>check</mat-icon><span>{{ f }}</span></div> }
            </div>
          </mat-card>
        }
      </div>

      <div class="action-bar">
        <button mat-stroked-button (click)="router.navigate(['/dashboard/stores'])">Skip for now</button>
        <button mat-flat-button color="primary" (click)="activate()" [disabled]="!selectedTier() || activating()">
          @if (activating()) { <mat-spinner diameter="18" /> }
          Activate {{ selectedTier() ? TIERS.find(t => t.id === selectedTier())?.name : '' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .subscription-page { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; color: var(--text-primary); }
    .page-header { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 2rem; }
    .page-header h1 { margin: 0; font-size: 1.6rem; font-weight: 800; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-secondary); font-size: 0.9rem; }
    .tier-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .tier-card { cursor: pointer; padding: 1.25rem; border-radius: 14px; transition: border-color 0.2s, box-shadow 0.2s; }
    .tier-card:hover { border-color: var(--primary-color); }
    .tier-card.selected { border-color: var(--primary-color); box-shadow: 0 4px 20px rgba(var(--primary-rgb), 0.15); background: rgba(var(--primary-rgb), 0.03); }
    .tier-header { display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.75rem; }
    .tier-icon { font-size: 2rem; width: 2rem; height: 2rem; color: var(--primary-color); }
    .tier-header h2 { margin: 0; font-size: 1.1rem; font-weight: 700; }
    .tier-price { display: block; font-size: 0.95rem; font-weight: 700; color: var(--primary-color); }
    .check-icon { margin-left: auto; color: var(--primary-color); font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }
    .tier-desc { font-size: 0.82rem; color: var(--text-secondary); margin: 0 0 0.75rem; line-height: 1.4; }
    .tier-features { display: flex; flex-direction: column; gap: 0.4rem; }
    .feature { display: flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; }
    .feature mat-icon { font-size: 1rem; width: 1rem; height: 1rem; color: var(--success-color); }
    .action-bar { display: flex; justify-content: center; }
    .action-bar button { min-width: 260px; height: 3rem; font-size: 1rem; font-weight: 700; }
    @media (max-width: 768px) { .tier-grid { grid-template-columns: 1fr; } }
  `],
})
export class ServiceSubscriptionComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly TIERS = TIERS;
  readonly selectedTier = signal<string | null>(null);
  readonly activating = signal(false);
  readonly storeId = signal('');

  ngOnInit(): void {
    this.storeId.set(this.route.snapshot.paramMap.get('storeId') || '');
  }

  async activate(): Promise<void> {
    const tier = this.selectedTier();
    if (!tier) return;

    this.activating.set(true);
    this.api.post<any>('api/v1/stores/service/subscribe', { storeId: this.storeId(), tier }, undefined, true).subscribe({
      next: () => {
        this.snackBar.open(`${TIERS.find(t => t.id === tier)?.name} plan activated!`, 'OK', { duration: 3000 });
        this.activating.set(false);
        this.router.navigate(['/dashboard/stores']);
      },
      error: (e) => {
        this.snackBar.open(e?.error?.message || 'Activation failed. Check wallet balance.', 'Close', { duration: 4000 });
        this.activating.set(false);
      },
    });
  }

  private getStoreId(): string {
    return window.location.pathname.split('/').pop() || '';
  }
}
