import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { CollectionsListComponent } from './collections-list.component';
import { CollectionsCreateComponent } from './collections-create.component';
import { CollectionsDetailComponent } from './collections-detail.component';
import { CollectionsListMobileComponent } from './mobile/collections-mobile.component';

@Component({
  selector: 'app-collections-index',
  standalone: true,
  imports: [CommonModule, CollectionsListComponent, CollectionsListMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-collections-list-mobile />
    } @else {
      <app-collections-list />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromoterCollectionsIndexComponent {
  private readonly deviceService = inject(DeviceService);
  protected readonly isMobileExperience = computed(() => {
    const t = this.deviceService.type();
    return t === 'mobile' || t === 'tablet';
  });
}

@Component({
  selector: 'app-collections-create-index',
  standalone: true,
  imports: [CommonModule, CollectionsCreateComponent],
  template: `<app-collections-create />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromoterCollectionsCreateIndexComponent {}

@Component({
  selector: 'app-collections-detail-index',
  standalone: true,
  imports: [CommonModule, CollectionsDetailComponent],
  template: `<app-collections-detail />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromoterCollectionsDetailIndexComponent {}
