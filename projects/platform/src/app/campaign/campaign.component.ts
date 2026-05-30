import { Component, Input, Signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService, UserInterface } from '@shared/services';
import { MarketerLandingComponent } from '../marketer/marketing-landing/marketer-landing.component';
import { PromoterLandingComponent } from '../promoter/promoter-landing/promoter-landing.component';
import { MarketerLandingMobileComponent } from '../marketer/marketing-landing/mobile/marketer-landing-mobile.component';
import { PromoterLandingMobileComponent } from '../promoter/promoter-landing/mobile/promoter-landing-mobile.component';


@Component({
  selector: 'campaign',
  standalone: true,
  imports: [
    CommonModule,
    MarketerLandingComponent,
    MarketerLandingMobileComponent,
    PromoterLandingComponent,
    PromoterLandingMobileComponent,
  ],
  template: `
    @if (user()?.role === 'marketer') {
      @if (isMobileExperience()) {
        <marketer-landing-mobile [user]="user" />
      } @else {
        <marketer-landing [user]="user" />
      }
    }

    @if (user()?.role === 'promoter') {
      @if (isMobileExperience()) {
        <promoter-landing-mobile [user]="user" />
      } @else {
        <promoter-landing [user]="user" />
      }
    }
  `,
})
export class CampaignComponent {
  private readonly deviceService = inject(DeviceService);
  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });

  // Required input that expects a signal of type UserInterface or undefined
  @Input({ required: true }) user!: Signal<UserInterface | null>;
}
