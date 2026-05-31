import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyUtilsPipe } from '@shared/services';
import { MarketerCustomerRecord } from '../../../services/store-customer.service';
import { CustomerSupportComponent } from '../customer-support.component';

@Component({
  selector: 'app-customer-support-mobile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CurrencyUtilsPipe,
  ],
  templateUrl: './customer-support-mobile.component.html',
  styleUrls: ['./customer-support-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerSupportMobileComponent extends CustomerSupportComponent {
  readonly filterSheetOpen = signal(false);
  readonly composerSheetOpen = signal(false);
  readonly detailSheetOpen = signal(false);

  openFilters(): void {
    this.filterSheetOpen.set(true);
  }

  closeFilters(): void {
    this.filterSheetOpen.set(false);
  }

  openComposer(): void {
    this.composerSheetOpen.set(true);
  }

  closeComposer(): void {
    this.composerSheetOpen.set(false);
  }

  openCustomerDetail(customer: MarketerCustomerRecord): void {
    this.selectBuyer(customer.buyerKey);
    this.detailSheetOpen.set(true);
  }

  closeCustomerDetail(): void {
    this.detailSheetOpen.set(false);
  }

  callCustomer(customer: MarketerCustomerRecord): void {
    if (!customer.phone) {
      void this.copyCustomerContact(customer);
      return;
    }

    window.location.href = `tel:${customer.phone}`;
  }

  resetFilters(): void {
    this.search.set('');
    this.storeFilter.set('all');
    this.lifecycleFilter.set('all');
    this.segmentFilter.set('all');
    this.marketingFilter.set('all');
    this.loadCustomers(true);
    this.closeFilters();
  }

  activeFilterCount(): number {
    return [
      this.storeFilter() !== 'all',
      this.lifecycleFilter() !== 'all',
      this.segmentFilter() !== 'all',
      this.marketingFilter() !== 'all',
      Boolean(this.search().trim()),
    ].filter(Boolean).length;
  }

  topSegmentCustomers(segment: 'vip' | 'repeat' | 'at_risk'): number {
    return this.customers().filter((customer) => customer.behaviorSegment === segment || customer.lifecycleStage === segment).length;
  }
}
