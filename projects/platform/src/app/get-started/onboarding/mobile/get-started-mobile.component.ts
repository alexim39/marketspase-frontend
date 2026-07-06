import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../../dashboard/dashboard.service';
import { CountdownOverlayComponent } from '../../../common/components/countdown-overlay/countdown-overlay.component';
import { GetStartedComponent, OnboardingStep } from '../get-started.component';

type MobileRole = 'marketer' | 'promoter';

@Component({
  selector: 'marketspase-get-started-mobile',
  standalone: true,
  providers: [DashboardService],
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    CountdownOverlayComponent,
  ],
  templateUrl: './get-started-mobile.component.html',
  styleUrl: './get-started-mobile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GetStartedMobileComponent extends GetStartedComponent {
  readonly activeVideoRole = signal<MobileRole>('marketer');

  readonly activeSteps = computed(() => this.getCurrentSteps());
  readonly visibleVideoRole = computed<MobileRole>(() => {
    const role = this.userRole();
    if (role === 'promoter') return 'promoter';
    if (role === 'marketer') return 'marketer';
    return this.activeVideoRole();
  });
  readonly canSwitchVideoRole = computed(() => this.userRole() === 'admin' || (!this.isMarketer() && !this.isPromoter()));
  readonly activeVideoGuides = computed(() =>
    this.visibleVideoRole() === 'marketer' ? this.marketerVideoGuides : this.promoterVideoGuides
  );
  readonly currentVideoUrl = computed(() =>
    this.userRole() === 'marketer' ? this.marketerVideoUrl : this.promoterVideoUrl
  );
  readonly completedSteps = computed(() => this.activeSteps().filter((step) => step.completed).length);
  readonly nextStep = computed<OnboardingStep | null>(() => {
    const steps = this.activeSteps();
    return steps.find((step) => !step.completed) ?? steps[0] ?? null;
  });

  readonly visibleFaqs = computed(() => this.categorizedFaqItems().slice(0, 4));

  readonly roleCards = [
    {
      role: 'marketer' as const,
      icon: 'storefront',
      title: 'I\'m a marketer',
      body: 'I want to advertise my business.',
    },
    {
      role: 'promoter' as const,
      icon: 'groups',
      title: 'I\'m a promoter',
      body: 'I want to promote businesses and earn from my influence.',
    },
  ];

  readonly trustTips = [
    { icon: 'link', title: 'Use tracked links', body: 'Always share the MarketSpase link generated for you.' },
    { icon: 'verified_user', title: 'Keep proof clean', body: 'Avoid fake traffic.' },
    { icon: 'payments', title: 'Watch earnings', body: 'Valid performance and good account health protect payouts.' },
  ];

  setActiveVideoRole(role: MobileRole): void {
    this.activeVideoRole.set(role);
  }
}
