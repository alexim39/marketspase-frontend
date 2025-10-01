// Update the quick-actions-sheet.component.ts
import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

export interface QuickAction {
  icon: string;
  label: string;
  action: string;
  color?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-quick-actions-sheet',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule],
  template: `
    <div class="quick-actions-sheet">
      <h3 class="sheet-title">Quick Actions</h3>
      
      <!-- User Switching Section -->
      <div class="user-switch-section" *ngIf="showUserSwitch()">
        <h4 class="section-title">Switch Role</h4>
        <div class="role-buttons">
          <!-- Even simpler approach using custom CSS classes -->
<div class="role-buttons">
  <button 
    mat-raised-button 
    [class.active-role]="currentRole() === 'marketer'"
    [class.inactive-role]="currentRole() !== 'marketer'"
    (click)="switchRole('marketer')"
    class="role-btn">
    <mat-icon>campaign</mat-icon>
    Marketer
  </button>
  <button 
    mat-raised-button 
    [class.active-role]="currentRole() === 'promoter'"
    [class.inactive-role]="currentRole() !== 'promoter'"
    (click)="switchRole('promoter')"
    class="role-btn">
    <mat-icon>megaphone</mat-icon>
    Promoter
  </button>
</div>
        </div>
      </div>

      <!-- Quick Actions List -->
      <mat-list>
        @for (action of getActions(); track action.action) {
          <mat-list-item 
            (click)="selectAction(action)"
            [class.disabled]="action.disabled"
            class="action-item">
            <mat-icon matListItemIcon [color]="action.color">{{action.icon}}</mat-icon>
            <div matListItemTitle>{{action.label}}</div>
          </mat-list-item>
        }
      </mat-list>
    </div>
  `,
  styles: [`
    .quick-actions-sheet {
      padding: 16px;
      background: white;
      border-radius: 16px 16px 0 0;
      max-height: 80vh;
      overflow-y: auto;
    }
    
    .sheet-title {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      text-align: center;
    }

    .user-switch-section {
      margin-bottom: 20px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;
      
      .section-title {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #666;
        text-align: center;
      }
      
      .role-buttons {
        display: flex;
        gap: 8px;
        
        .role-btn {
          flex: 1;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          
          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            margin-right: 4px;
          }
        }
      }
    }
    
    .action-item {
      border-radius: 12px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: background-color 0.2s;
      
      &:hover {
        background-color: #f5f5f5;
      }
      
      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        
        &:hover {
          background-color: transparent;
        }
      }
    }
  `]
})
export class QuickActionsSheetComponent {
  private bottomSheetRef = inject(MatBottomSheetRef);
  
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: any) {}

  currentRole() {
    return this.data.user?.role;
  }

  showUserSwitch() {
    const user = this.data.user;
    return user && (user.roles?.includes('marketer') || user.roles?.includes('promoter'));
  }

  switchRole(role: string): void {
    if (role !== this.currentRole()) {
      this.data.onActionSelected('switchRole', role);
      this.bottomSheetRef.dismiss();
    }
  }

  getActions(): QuickAction[] {
    const user = this.data.user;
    const actions: QuickAction[] = [];

    if (user?.role === 'marketer') {
      actions.push(
        { icon: 'add', label: 'Create Campaign', action: 'createCampaign', color: 'primary' },
        { icon: 'campaign', label: 'My Campaigns', action: 'viewCampaigns' },
        { icon: 'search', label: 'Browse Campaigns', action: 'browseCampaign' }
      );
    } else if (user?.role === 'promoter') {
      actions.push(
        { icon: 'search', label: 'Browse Campaigns', action: 'browseCampaign', color: 'primary' },
        { icon: 'assignment', label: 'My Promotions', action: 'viewPromotions' },
        { icon: 'payments', label: 'Withdraw Funds', action: 'withdraw' }
      );
    }

    // Common actions
    actions.push(
      { icon: 'account_balance_wallet', label: 'Transaction History', action: 'transactions' },
      { icon: 'person', label: 'My Profile', action: 'profile' },
      { icon: 'settings', label: 'Settings', action: 'settings' },
      { icon: 'help', label: 'Help & Support', action: 'help' },
      { icon: 'logout', label: 'Logout', action: 'logout', color: 'warn' }
    );

    return actions;
  }

  selectAction(action: QuickAction): void {
    if (!action.disabled) {
      this.data.onActionSelected(action.action);
      this.bottomSheetRef.dismiss();
    }
  }
}