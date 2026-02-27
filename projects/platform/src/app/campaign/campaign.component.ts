import { Component, Input, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserInterface } from '../../../../shared-services/src/public-api';
import { MarketerLandingComponent } from '../marketer/marketing-landing/marketer-landing.component';
import { PromoterLandingComponent } from '../promoter/promoter-landing/promoter-landing.component';


@Component({
  selector: 'campaign',
  standalone: true,
  imports: [CommonModule, MarketerLandingComponent, PromoterLandingComponent],
  template: `
      
    @if (user()?.role === 'marketer') {
      <marketer-landing [user]="user" />
    }
    
    @if (user()?.role === 'promoter') {
      <promoter-landing [user]="user"/>
    }

  `,
})
export class CampaignComponent {
  // Required input that expects a signal of type UserInterface or undefined
  @Input({ required: true }) user!: Signal<UserInterface | null>;
}
