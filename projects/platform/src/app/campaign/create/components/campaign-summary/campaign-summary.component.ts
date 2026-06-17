import { Component, computed, input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FormGroup } from '@angular/forms';
import { MediaFile } from '../../media-file.model';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ShortNumberPipe } from '../../../../common/pipes/short-number.pipe';
import { startWith, switchMap } from 'rxjs/operators';

interface AgeGroupInfo {
  value: string;
  label: string;
  description: string;
  icon: string;
  range: string;
}

type CampaignGoal = 'awareness' | 'leads';

interface GoalSummaryInfo {
  label: string;
  icon: string;
  outcomeLabel: string;
  outcomeSuffix: string;
  description: string;
}

@Component({
  selector: 'app-campaign-summary',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    CurrencyPipe,
    DatePipe,
    ShortNumberPipe
  ],
  templateUrl: './campaign-summary.component.html',
  styleUrls: ['./campaign-summary.component.scss']
})
export class CampaignSummaryComponent {
  contentForm = input.required<FormGroup>();
  goalForm = input.required<FormGroup>();
  budgetForm = input.required<FormGroup>();
  scheduleForm = input.required<FormGroup>();
  selectedMedia = input<MediaFile | null>(null);
  costPerClick = input(80);

  private readonly ageGroups: AgeGroupInfo[] = [
    {
      value: 'all',
      label: 'All Ages',
      description: 'Target everyone regardless of age',
      icon: 'groups',
      range: '18-65+'
    },
    {
      value: 'young',
      label: 'Young Adults',
      description: 'Target users between 18-24 years',
      icon: 'school',
      range: '18-24'
    },
    {
      value: 'middle',
      label: 'Middle Age',
      description: 'Target users between 25-44 years',
      icon: 'work',
      range: '25-44'
    },
    {
      value: 'advanced',
      label: 'Advanced Age',
      description: 'Target users 45 years and above',
      icon: 'elderly',
      range: '45+'
    }
  ];

  private readonly goalConfig: Record<CampaignGoal, GoalSummaryInfo> = {
    awareness: {
      label: 'Customer Awareness',
      icon: 'campaign',
      outcomeLabel: 'Estimated Reach',
      outcomeSuffix: 'awareness-driven clicks',
      description: 'Best for visibility, announcements, causes, programs, launches, and wide message spread.'
    },
    leads: {
      label: 'Customer Leads',
      icon: 'support_agent',
      outcomeLabel: 'Estimated Leads',
      outcomeSuffix: 'sales-focused clicks',
      description: 'Best for WhatsApp chats, direct enquiries, CTA clicks, and sales-oriented campaigns.'
    }
  };

  private budgetValue = toSignal(
    toObservable(this.budgetForm).pipe(
      switchMap((form) =>
        form.get('budget')!.valueChanges.pipe(
          startWith(form.get('budget')?.value)
        )
      )
    ),
    { initialValue: 0 }
  );

  private ageTargetValue = toSignal(
    toObservable(this.budgetForm).pipe(
      switchMap((form) =>
        form.get('ageTarget')!.valueChanges.pipe(
          startWith(form.get('ageTarget')?.value || 'all')
        )
      )
    ),
    { initialValue: 'all' }
  );

  private goalValue = toSignal(
    toObservable(this.goalForm).pipe(
      switchMap((form) =>
        form.get('campaignGoal')!.valueChanges.pipe(
          startWith(form.get('campaignGoal')?.value || 'awareness')
        )
      )
    ),
    { initialValue: 'awareness' }
  );

  public selectedAgeGroup = computed(() => {
    const ageTarget = this.ageTargetValue();
    return this.ageGroups.find((group) => group.value === ageTarget) || this.ageGroups[0];
  });

  public selectedGoal = computed(() => {
    const goal = (this.goalValue() as CampaignGoal) || 'awareness';
    return this.goalConfig[goal] ?? this.goalConfig.awareness;
  });

  public estimatedOutcome = computed(() => {
    const budget = this.budgetValue() || 0;
    const costPerClick = Number(this.costPerClick() || 80);
    return Math.floor(budget / costPerClick);
  });

  public getAgeTargetDisplay(): string {
    return this.selectedAgeGroup().label;
  }

  public getAgeRange(): string {
    return this.selectedAgeGroup().range;
  }

  public getAgeIcon(): string {
    return this.selectedAgeGroup().icon;
  }

  public getGoalIcon(): string {
    return this.selectedGoal().icon;
  }

  getDuration(): string {
    const start = this.scheduleForm().get('startDate')?.value;
    const end = this.scheduleForm().get('endDate')?.value;

    if (start && end) {
      const diffInMs = new Date(end).getTime() - new Date(start).getTime();
      const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      return `${days} days`;
    }

    return 'Budget Based';
  }
}
