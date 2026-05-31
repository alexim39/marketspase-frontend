import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { ProfileService } from '../../settings/account/profile.service';
import { ReferralCaptureComponent } from '../referral-capture.component';

@Component({
  selector: 'app-referral-capture-mobile',
  standalone: true,
  providers: [ProfileService],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './referral-capture-mobile.component.html',
  styleUrl: './referral-capture-mobile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferralCaptureMobileComponent extends ReferralCaptureComponent {
  readonly steps = [
    {
      icon: 'verified_user',
      title: 'Invite checked',
      body: 'We verify the promoter before saving this invite.',
    },
    {
      icon: 'redeem',
      title: 'Referral saved',
      body: 'The invite is kept on this device for signup.',
    },
    {
      icon: 'trending_up',
      title: 'Bonus-ready',
      body: 'Both accounts can earn when the first qualifying activity is completed.',
    },
  ];
}
