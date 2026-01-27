// components/quick-action-bar/quick-action-bar.component.ts
import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { Store } from '../../../models/store.model';
import { Router } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';

interface QuickAction {
  icon: string;
  label: string;
  description: string;
  action: () => void;
  color: 'primary' | 'accent' | 'warn';
  disabled: boolean;
  badge?: number;
  badgeColor?: 'primary' | 'accent' | 'warn';
  requiresVerification?: boolean;
}

@Component({
  selector: 'app-quick-action-bar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './quick-action-bar.component.html',
  styleUrls: ['./quick-action-bar.component.scss']
})
export class QuickActionBarComponent {
  private router = inject(Router);

  // Inputs
  store = input<Store | null>(null);
  isMobile = input<boolean>(false);
  lowStockCount = input<number>(0);
  pendingPromotions = input<number>(0);

  // Outputs
  addProduct = output<void>();
  createPromotion = output<void>();
  viewAnalytics = output<void>();
  manageInventory = output<void>();
  viewPromotions = output<void>();
  storeSettings = output<void>();

  // Computed actions
  quickActions = computed((): QuickAction[] => {
    const store = this.store();
    const mobile = this.isMobile();
    const lowStock = this.lowStockCount();
    const pending = this.pendingPromotions();

    if (!store) return [];

    const canPromote = store.isVerified;
const actions: QuickAction[] = [
  {
    icon: 'add',
    label: 'Add Product',
    description: 'Add new items to your store',
    action: () => this.addProduct.emit(),
    color: 'primary',
    disabled: false,
    requiresVerification: false
  },
  {
    icon: 'campaign',
    label: 'Create Promotion',
    description: 'Launch a promoter campaign',
    action: () => this.createPromotion.emit(),
    color: 'accent',
    disabled: !canPromote,
    requiresVerification: true,
    badge: pending > 0 ? pending : undefined,
    badgeColor: 'accent'
  },
  {
    icon: 'analytics',
    label: 'View Analytics',
    description: 'Check store performance',
    action: () => this.viewAnalytics.emit(),
    color: 'primary',
    disabled: false,
    requiresVerification: false
  },
  {
    icon: 'inventory_2',
    label: 'Manage Inventory',
    description: 'Update product quantities',
    action: () => this.manageInventory.emit(),
    color: 'primary',
    disabled: false,
    badge: lowStock > 0 ? lowStock : undefined,
    badgeColor: 'warn'
  },
  {
    icon: 'list_alt',
    label: 'View Promotions',
    description: 'See active campaigns',
    action: () => this.viewPromotions.emit(),
    color: 'primary',
    disabled: false,
    requiresVerification: false
  },
  {
    icon: 'settings',
    label: 'Store Settings',
    description: 'Configure store preferences',
    action: () => this.storeSettings.emit(),
    color: 'primary',
    disabled: false,
    requiresVerification: false
  }
];

return actions.filter(action => mobile ? !action.requiresVerification : true);
  });

  // Mobile-specific actions
  mobileActions = computed(() => 
    this.quickActions().slice(0, 3) // Show only first 3 actions on mobile
  );

  onAddProduct(): void {
    this.addProduct.emit();
  }

  onCreatePromotion(): void {
    this.createPromotion.emit();
  }

  onViewAnalytics(): void {
    this.viewAnalytics.emit();
  }

  onManageInventory(): void {
    this.manageInventory.emit();
  }

  onViewPromotions(): void {
    this.viewPromotions.emit();
  }

  onStoreSettings(): void {
    this.storeSettings.emit();
  }

  trackByActionLabel(index: number, action: QuickAction): string {
    return action.label;
  }
}