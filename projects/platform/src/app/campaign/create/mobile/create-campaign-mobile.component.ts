import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CampaignBudgetFormComponent } from '../components/campaign-budget-form/campaign-budget-form.component';
import { CampaignContentFormComponent } from '../components/campaign-content-form/campaign-content-form.component';
import { CampaignGoalFormComponent } from '../components/campaign-goal-form/campaign-goal-form.component';
import { CampaignScheduleFormComponent } from '../components/campaign-schedule-form/campaign-schedule-form.component';
import { CampaignSummaryComponent } from '../components/campaign-summary/campaign-summary.component';
import { CreateCampaignComponent } from '../create-campaign.component';
import { CampaignService } from '../create.service';

interface MobileCampaignStep {
  number: number;
  icon: string;
  label: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-create-campaign-mobile',
  standalone: true,
  providers: [CampaignService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule,
    CampaignContentFormComponent,
    CampaignGoalFormComponent,
    CampaignBudgetFormComponent,
    CampaignScheduleFormComponent,
    CampaignSummaryComponent,
  ],
  templateUrl: './create-campaign-mobile.component.html',
  styleUrls: ['./create-campaign-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCampaignMobileComponent extends CreateCampaignComponent {
  protected readonly mobileSteps: MobileCampaignStep[] = [
    {
      number: 1,
      icon: 'perm_media',
      label: 'Content',
      title: 'Build the campaign asset',
      description: 'Add the title, media, caption, destination link, and category promoters will use.',
    },
    {
      number: 2,
      icon: 'track_changes',
      label: 'Goal',
      title: 'Choose the outcome',
      description: 'Tell MarketSpase what this campaign should optimize for.',
    },
    {
      number: 3,
      icon: 'account_balance_wallet',
      label: 'Budget',
      title: 'Set budget and audience',
      description: 'Confirm wallet cover, PPC spend, and basic targeting before launch.',
    },
    {
      number: 4,
      icon: 'event',
      label: 'Schedule',
      title: 'Control timing',
      description: 'Choose when the campaign starts and whether it should stop on a date.',
    },
    {
      number: 5,
      icon: 'fact_check',
      label: 'Review',
      title: 'Review and launch',
      description: 'Check the final mobile preview, payout model, schedule, and budget.',
    },
  ];

  protected readonly currentStepMeta = computed(
    () => this.mobileSteps.find((step) => step.number === this.currentStep()) ?? this.mobileSteps[0],
  );

  protected readonly completedStepCount = computed(
    () => this.mobileSteps.filter((step) => this.isStepActive(step.number)).length,
  );

  protected readonly stepProgress = computed(() => (this.currentStep() / this.mobileSteps.length) * 100);

  protected readonly budgetPreview = computed(() => Number(this.budgetValue() || 0));

  protected readonly estimatedVerifiedClicks = computed(() => Math.floor(this.budgetPreview() / 80));
}
