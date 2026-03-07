// recent-activity.component.ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

// Update in recent-activity.component.ts
export interface Activity {
  id: string;
  description: string; // Remove optional, make required
  amount: number;
  type: 'credit' | 'debit';
  createdAt: string | Date;
  status?: 'completed' | 'pending' | 'failed';
  walletType?: 'marketer' | 'promoter';
  // Add optional properties that might come from your data
  _id?: string;
  category?: string;
  isDefault?: boolean;
  bankDetails?: any;
}

@Component({
  selector: 'recent-activity',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: 'recent-activity.component.html',
  styleUrls: ['recent-activity.component.scss']
})
export class RecentActivityComponent {
  activities = input<Activity[]>([]);
  userRole = input<'marketer' | 'promoter' | 'marketing_rep' | 'admin' | undefined>();

  viewAll = output<void>();
  activityClick = output<Activity>();
  browseCampaigns = output<void>();
  createCampaign = output<void>();

  totalCredits = () => {
    return this.activities()
      .filter(a => a.type === 'credit')
      .reduce((sum, a) => sum + a.amount, 0);
  }

  totalDebits = () => {
    return this.activities()
      .filter(a => a.type === 'debit')
      .reduce((sum, a) => sum + a.amount, 0);
  }

  netChange = () => {
    return this.totalCredits() - this.totalDebits();
  }

  onActivityClick(activity: Activity): void {
    this.activityClick.emit(activity);
  }
}