import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { DeviceService } from '@shared/services/device';
import { StoreProductsListComponent } from './store-products-list.component';
import { StoreProductsListMobileComponent } from './mobile/store-products-list-mobile.component';

@Component({
  selector: 'app-store-products-list-index',
  standalone: true,
  imports: [CommonModule, StoreProductsListComponent, StoreProductsListMobileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (storeId(); as id) {
      @if (isMobileExperience()) {
        <app-store-products-list-mobile [storeId]="id" />
      } @else {
        <app-store-products-list [storeId]="id" />
      }
    }
  `,
})
export class StoreProductsListIndexComponent {
  private readonly deviceService = inject(DeviceService);
  private readonly route = inject(ActivatedRoute);
  private readonly routeParams = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly storeId = computed(() => this.routeParams().get('storeId') || '');

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
