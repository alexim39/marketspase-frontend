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
import { UserService } from '../../../common/services/user.service';
import { EngagementService } from '../../engagement.service';

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatIconModule, MatCardModule,
    MatProgressBarModule, MatProgressSpinnerModule],
  templateUrl: './contract-detail.component.html',
  styleUrls: ['./contract-detail.component.scss']
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
