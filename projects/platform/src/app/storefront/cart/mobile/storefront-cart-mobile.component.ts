import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CurrencyUtilsPipe } from '@shared/services';
import { PaystackService } from '../../../common/services/paystack.service';
import { StorefrontService } from '../../services/storefront.service';
import { StorefrontCartComponent } from '../storefront-cart.component';
import { StorefrontCartGroup, StorefrontCartItem } from '../../services/storefront-cart.service';

@Component({
  selector: 'app-mobile-storefront-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    CurrencyUtilsPipe
  ],
  providers: [StorefrontService, PaystackService],
  templateUrl: './storefront-cart-mobile.component.html',
  styleUrls: ['./storefront-cart-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileStorefrontCartComponent extends StorefrontCartComponent {
  readonly checkoutOpen = signal(false);

  readonly trustItems = [
    { icon: 'person', label: 'Guest checkout' },
    { icon: 'mail', label: 'Email receipt' },
    { icon: 'verified_user', label: 'Escrow protected' }
  ];

  readonly selectedStoreSummary = computed(() => {
    const group = this.selectedGroup();
    if (!group) {
      return 'No store selected';
    }
    return `${group.itemCount} item${group.itemCount === 1 ? '' : 's'} ready`;
  });

  readonly groupedStoreCount = computed(() => this.groups().length);

  openCheckout(group?: StorefrontCartGroup): void {
    if (group) {
      this.selectGroup(group);
    }
    this.checkoutError.set(null);
    this.checkoutOpen.set(true);
    setTimeout(() => {
      document.querySelector('.checkout-sheet')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }

  closeCheckout(): void {
    if (!this.checkoutLoading()) {
      this.checkoutOpen.set(false);
    }
  }

  goBack(): void {
    if (history.length > 1) { history.back(); } else { window.location.href = '/'; }
  }

  override async checkoutSelectedStore(): Promise<void> {
    await super.checkoutSelectedStore();
    if (!this.checkoutError()) {
      this.checkoutOpen.set(false);
    }
  }

  itemImage(item: StorefrontCartItem): string {
    return item.image || 'assets/images/product-placeholder.svg';
  }

  canIncrease(item: StorefrontCartItem): boolean {
    return !item.soldIndividually && item.quantity < (item.maxQuantity || 999);
  }
}
