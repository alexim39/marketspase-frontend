import { Component, input, computed, inject, Signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FormGroup } from '@angular/forms';
import { MediaFile } from '../../media-file.model';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { ShortNumberPipe } from '../../../../common/pipes/short-number.pipe';
import { startWith, switchMap } from 'rxjs/operators';

// Define age group interface for better type safety
interface AgeGroupInfo {
  value: string;
  label: string;
  description: string;
  icon: string;
  range: string;
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
  // 1. Convert @Inputs to Signal Inputs
  contentForm = input.required<FormGroup>();
  budgetForm = input.required<FormGroup>();
  scheduleForm = input.required<FormGroup>();
  selectedMedia = input<MediaFile | null>(null);

  // Age group configuration matching the budget component
  private ageGroups: AgeGroupInfo[] = [
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

  // 2. Create the budget signal by watching the input signal
  private budgetValue = toSignal(
    toObservable(this.budgetForm).pipe(
      switchMap(form => 
        form.get('budget')!.valueChanges.pipe(
          startWith(form.get('budget')?.value)
        )
      )
    ),
    { initialValue: 0 }
  );

  // 3. Create signal for age target value
  private ageTargetValue = toSignal(
    toObservable(this.budgetForm).pipe(
      switchMap(form => 
        form.get('ageTarget')!.valueChanges.pipe(
          startWith(form.get('ageTarget')?.value || 'all')
        )
      )
    ),
    { initialValue: 'all' }
  );

  // 4. Computed signal for age target display
  public selectedAgeGroup = computed(() => {
    const ageTarget = this.ageTargetValue();
    const group = this.ageGroups.find(g => g.value === ageTarget);
    return group || this.ageGroups[0]; // Default to "All Ages" if not found
  });

  public slots = computed(() => {
    const budget = this.budgetValue() || 0;
    return Math.floor(budget / 200);
  });

  public estimatedReach = computed(() => {
    return this.slots() * 45;
  });

  // Helper method to get friendly age target display
  public getAgeTargetDisplay(): string {
    return this.selectedAgeGroup().label;
  }

  // Helper method to get age range
  public getAgeRange(): string {
    return this.selectedAgeGroup().range;
  }

  // Helper method to get icon name
  public getAgeIcon(): string {
    return this.selectedAgeGroup().icon;
  }
}