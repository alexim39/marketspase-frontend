import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';

type CampaignGoal = 'awareness' | 'leads';
type PayoutModel = 'pay_per_click' | 'cost_per_lead';

interface GoalOption {
  value: CampaignGoal;
  title: string;
  icon: string;
  description: string;
  highlights: string[];
  footer: string;
}

interface PayoutModelOption {
  value: PayoutModel;
  title: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-campaign-goal-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './campaign-goal-form.component.html',
  styleUrls: ['./campaign-goal-form.component.scss']
})
export class CampaignGoalFormComponent implements OnInit {
  @Input({ required: true }) formGroup!: FormGroup;
  @Output() validityChange = new EventEmitter<boolean>();

  private readonly destroyRef = inject(DestroyRef);

  readonly payoutModelOptions: PayoutModelOption[] = [
    {
      value: 'pay_per_click',
      title: 'Pay Per Click (CPC)',
      icon: 'ads_click',
      description: 'Pay each time someone clicks your campaign link. Budget drains per click.'
    },
    {
      value: 'cost_per_lead',
      title: 'Cost Per Lead (CPL)',
      icon: 'person_add',
      description: 'Pay only when a qualified lead submits their contact info. More cost-effective for conversion campaigns.'
    }
  ];

  readonly goalOptions: GoalOption[] = [
    {
      value: 'awareness',
      title: 'Customer Awareness',
      icon: 'campaign',
      description:
        'Choose this when your priority is visibility. Awareness campaigns help more people notice your product, service, event, or cause, while usually bringing fewer direct sales enquiries.',
      highlights: [
        'Political election campaigns',
        'Church and ministry programs',
        'School programs and events',
        'Community announcements',
        'Brand or product launches'
      ],
      footer: 'Best for visibility, recognition, and message spread.'
    },
    {
      value: 'leads',
      title: 'Customer Leads',
      icon: 'support_agent',
      description:
        'Choose this when you want people to take direct action. Lead campaigns are built to drive WhatsApp chats, CTA clicks, and sales-focused enquiries.',
      highlights: [
        'Direct product sales',
        'Service enquiries and bookings',
        'WhatsApp conversations',
        'CTA clicks to your sales page',
        'High-intent customer follow-ups'
      ],
      footer: 'Best for conversions, customer chats, and sales.'
    }
  ];

  ngOnInit(): void {
    this.formGroup.statusChanges
      .pipe(startWith(this.formGroup.status), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.validityChange.emit(this.formGroup.valid);
      });
  }

  selectGoal(goal: CampaignGoal): void {
    this.formGroup.get('campaignGoal')?.setValue(goal);
    this.formGroup.get('campaignGoal')?.markAsTouched();
    this.formGroup.get('campaignGoal')?.markAsDirty();
  }

  isSelected(goal: CampaignGoal): boolean {
    return this.formGroup.get('campaignGoal')?.value === goal;
  }

  selectPayoutModel(model: PayoutModel): void {
    this.formGroup.get('payoutModel')?.setValue(model);
    this.formGroup.get('payoutModel')?.markAsTouched();
    this.formGroup.get('payoutModel')?.markAsDirty();
  }

  isPayoutModelSelected(model: PayoutModel): boolean {
    return this.formGroup.get('payoutModel')?.value === model;
  }
}
