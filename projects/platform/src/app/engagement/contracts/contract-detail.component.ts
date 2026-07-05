import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../common/services/user.service';
import { EngagementService } from '../engagement.service';

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatIconModule, MatCardModule,
    MatProgressBarModule, MatProgressSpinnerModule],
  template: `
    <div class="detail-page">
      <header class="page-header">
        <button mat-icon-button routerLink="/dashboard/contracts"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <h1>Contract Details</h1>
          <span class="cc-status" [class]="contract()?.status">{{ contract()?.status }}</span>
        </div>
      </header>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="32"/></div>
      } @else if (contract()) {
        <mat-card class="detail-card">
          <div class="party-row">
            <div>
              <span class="label">Marketer</span>
              <strong>{{ contract()?.marketerId?.displayName }}</strong>
            </div>
            <mat-icon>swap_horiz</mat-icon>
            <div style="text-align:right">
              <span class="label">Promoter</span>
              <strong>{{ contract()?.promoterId?.displayName }}</strong>
            </div>
          </div>
        </mat-card>

        <mat-card class="detail-card">
          <h3>Progress</h3>
          <mat-progress-bar mode="determinate" [value]="contract()?.progress || 0"></mat-progress-bar>
          <p class="progress-text">{{ contract()?.progress || 0 }}% complete</p>

          <div class="tasks-list">
            @for (task of contract()?.tasks || []; track task.type; let i = $index) {
              <div class="task-item">
                <div class="task-info">
                  <strong>{{ task.type | titlecase }}</strong>
                  <span>{{ task.completed }} / {{ task.target }}</span>
                </div>
                <mat-progress-bar mode="determinate" [value]="task.target ? (task.completed / task.target * 100) : 0"></mat-progress-bar>
                @if (isPromoter() && contract()?.status === 'active') {
                  <button mat-stroked-button class="task-btn" (click)="incrementTask(i)">+1 {{ task.type }}</button>
                }
              </div>
            }
          </div>
        </mat-card>

        <mat-card class="detail-card">
          <h3>Payment</h3>
          <div class="payment-summary">
            <div><span class="label">Total</span><strong>₦{{ contract()?.payment?.total | number }}</strong></div>
            <div><span class="label">Released</span><strong>₦{{ contract()?.payment?.released | number }}</strong></div>
            <div><span class="label">Schedule</span><strong>{{ contract()?.payment?.schedule }}</strong></div>
          </div>

          @if (contract()?.escrow) {
            <p class="escrow-note">Funds held in escrow. Released on {{ isPromoter() ? 'marketer approval' : 'your approval' }}.</p>
          }
        </mat-card>

        @if (contract()?.contractTerms) {
          <mat-card class="detail-card">
            <h3>Terms</h3>
            <p>{{ contract()?.contractTerms }}</p>
          </mat-card>
        }

        <div class="actions">
          @if (contract()?.status === 'pending' && isPromoter()) {
            <button mat-flat-button color="primary" (click)="respond('accept')">Accept Contract</button>
            <button mat-stroked-button color="warn" (click)="respond('decline')">Decline</button>
          }
          @if (!isPromoter() && contract()?.status === 'active' && contract()?.progress >= 100) {
            <button mat-flat-button color="primary" (click)="approveMilestone()">Approve & Release Payment</button>
          }
          @if (contract()?.status === 'milestone-review' && !isPromoter()) {
            <button mat-flat-button color="primary" (click)="approveMilestone()">Approve Milestone</button>
          }
          @if (contract()?.status === 'completed' && !contract()?.marketerRating) {
            <div class="rating-area">
              <h3>Rate Experience</h3>
              @for (star of [1,2,3,4,5]; track star) {
                <button mat-icon-button (click)="rating = star" [color]="star <= rating ? 'primary' : ''">
                  <mat-icon>{{ star <= rating ? 'star' : 'star_border' }}</mat-icon>
                </button>
              }
              @if (rating) {
                <button mat-stroked-button color="primary" (click)="submitRating()">Submit Rating</button>
              }
            </div>
          }
          @if (contract()?.status === 'active' || contract()?.status === 'milestone-review') {
            <button mat-stroked-button color="warn" (click)="dispute()">
              <mat-icon>flag</mat-icon> Dispute
            </button>
          }
        </div>
      } @else {
        <div class="empty">Contract not found.</div>
      }
    </div>
  `,
  styles: [`
    .detail-page { padding: 24px; max-width: 700px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; h1 { margin: 0; font-size: 1.2rem; } }
    .detail-card { padding: 20px; margin-bottom: 16px; h3 { margin: 0 0 12px; font-size: 1rem; font-weight: 700; } }
    .party-row { display: flex; align-items: center; justify-content: space-between; .label { display: block; font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; } strong { display: block; font-size: 1.05rem; } }
    .progress-text { font-size: 0.85rem; color: var(--text-secondary); margin: 6px 0 0; }
    .tasks-list { display: flex; flex-direction: column; gap: 14px; margin-top: 16px; }
    .task-item { .task-info { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.85rem; strong { text-transform: capitalize; } span { color: var(--text-secondary); } } .task-btn { font-size: 0.7rem; min-height: 28px; margin-top: 6px; } }
    .payment-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; .label { display: block; font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; } strong { display: block; font-size: 1rem; margin-top: 2px; } }
    .escrow-note { font-size: 0.78rem; color: var(--text-secondary); margin: 12px 0 0; }
    .actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .rating-area { h3 { margin: 0 0 8px; } }
    .loading, .empty { text-align: center; padding: 40px; color: var(--text-secondary); }
  `]
})
export class EngagementContractDetailComponent implements OnInit {
  private service = inject(EngagementService);
  private route = inject(ActivatedRoute);
  private snack = inject(MatSnackBar);
  private userService = inject(UserService);

  contract = signal<any>(null);
  loading = signal(true);
  rating = 0;

  isPromoter = computed(() => this.userService.user()?.role === 'promoter');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.getContract(id).subscribe({
        next: (r: any) => { this.contract.set(r?.data); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
    }
  }

  respond(action: 'accept' | 'decline'): void {
    const c = this.contract();
    if (!c?._id) return;
    this.service.respondToContract(c._id, action).subscribe({
      next: (r: any) => { this.contract.set(r?.data); this.snack.open(action === 'accept' ? 'Accepted!' : 'Declined', 'OK', { duration: 2000 }); },
      error: (e) => this.snack.open(e?.error?.message || 'Error', 'OK', { duration: 3000 })
    });
  }

  incrementTask(taskIndex: number): void {
    const c = this.contract();
    if (!c?._id || !c.tasks?.[taskIndex]) return;
    const task = c.tasks[taskIndex];
    this.service.updateTaskProgress(c._id, taskIndex, task.completed + 1).subscribe({
      next: (r: any) => this.contract.set(r?.data),
      error: (e) => this.snack.open(e?.error?.message || 'Error', 'OK', { duration: 3000 })
    });
  }

  approveMilestone(): void {
    const c = this.contract();
    if (!c?._id) return;
    this.service.approveMilestone(c._id).subscribe({
      next: (r: any) => { this.contract.set(r?.data); this.snack.open('Payment released!', 'OK', { duration: 2000 }); },
      error: (e) => this.snack.open(e?.error?.message || 'Error', 'OK', { duration: 3000 })
    });
  }

  submitRating(): void {
    const c = this.contract();
    if (!c?._id || !this.rating) return;
    const role = this.isPromoter() ? 'promoter' : 'marketer';
    this.service.rateContract(c._id, this.rating, '', role).subscribe({
      next: () => this.snack.open('Rating saved!', 'OK', { duration: 2000 }),
      error: (e) => this.snack.open(e?.error?.message || 'Error', 'OK', { duration: 3000 })
    });
  }

  dispute(): void {
    const reason = prompt('Why are you disputing this contract?');
    if (!reason?.trim()) return;
    const c = this.contract();
    if (!c?._id) return;
    this.service.disputeContract(c._id, reason.trim()).subscribe({
      next: (r: any) => { this.contract.set(r?.data); this.snack.open('Dispute filed. Support will review.', 'OK', { duration: 3000 }); },
      error: (e) => this.snack.open(e?.error?.message || 'Error', 'OK', { duration: 3000 })
    });
  }
}
