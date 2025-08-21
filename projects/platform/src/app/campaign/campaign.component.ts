import { Component, Input, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserInterface } from '../common/services/user.service';
import { AdvertiserCampaignLandingComponent } from './advertiser/advertiser-landing.component';
import { PromoterLandingComponent } from './promoters/promoter-landing.component';


@Component({
  selector: 'campaign',
  standalone: true,
  imports: [CommonModule, AdvertiserCampaignLandingComponent, PromoterLandingComponent],
  template: `
      
    @if (user()?.role === 'advertiser') {
      <advertiser-campaign-landing [user]="user" />
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
