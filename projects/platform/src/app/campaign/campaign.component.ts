import { Component, Input, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserInterface } from '../../../../shared-services/src/public-api';
import { MarketerCampaignLandingComponent } from '../marketer/marketer-landing.component';
import { PromoterLandingComponent } from '../promoter/landing-landing/promoter-landing.component';


@Component({
  selector: 'campaign',
  standalone: true,
  imports: [CommonModule, MarketerCampaignLandingComponent, PromoterLandingComponent],
  template: `
      
    @if (user()?.role === 'advertiser') {
      <marketer-campaign-landing [user]="user" />
    }
    
    @if (user()?.role === 'promoter') {
      <promoter-landing [user]="user"/>
    }

  `,
})
export class CampaignComponent {
  // Required input that expects a signal of type UserInterface or undefined
  @Input({ required: true }) user!: Signal<UserInterface | null>;;
}
