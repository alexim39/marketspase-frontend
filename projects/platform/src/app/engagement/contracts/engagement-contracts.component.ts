import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
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
  selector: 'app-engagement-contracts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatIconModule, MatCardModule,
    MatProgressBarModule, MatProgressSpinnerModule],
  templateUrl: './engagement-contracts.component.html',
  styleUrls: ['./engagement-contracts.component.scss']
})
export class EngagementContractsComponent implements OnInit {
  private service = inject(EngagementService);
  private userService = inject(UserService);

  contracts = signal<any[]>([]);
  loading = signal(true);
  filter = signal<'all' | 'active' | 'completed'>('all');

  isPromoter = computed(() => this.userService.user()?.role === 'promoter');
  filteredContracts = computed(() => {
    const f = this.filter();
    const all = this.contracts();
    if (f === 'all') return all;
    return all.filter(c => c.status === f);
  });

  ngOnInit(): void {
    const role = this.isPromoter() ? 'promoter' : 'marketer';
    this.service.listContracts(role).subscribe({
      next: (r: any) => { this.contracts.set(r?.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
