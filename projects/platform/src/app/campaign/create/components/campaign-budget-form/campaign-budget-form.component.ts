import { Component, Input, Output, EventEmitter, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ShortNumberPipe } from '../../../../common/pipes/short-number.pipe';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';

export type AgeGroup = 'all' | 'young' | 'middle' | 'advanced';

@Component({
  selector: 'app-campaign-budget-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    ShortNumberPipe,
    MatSlideToggleModule,
    MatRadioModule,
    FormsModule
  ],
  templateUrl: './campaign-budget-form.component.html',
  styleUrls: ['./campaign-budget-form.component.scss']
})
export class CampaignBudgetFormComponent implements OnInit {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input({ required: true }) walletBalance!: number;
  @Output() validityChange = new EventEmitter<boolean>();
  @Output() fundWallet = new EventEmitter<void>();

  private destroyRef = inject(DestroyRef);
  
  public estimatedReach = 0;
  
  // Age targeting options with descriptions
  public ageGroups = [
    {
      value: 'all' as AgeGroup,
      label: 'All Ages',
      description: 'You are targeting everyone regardless of age',
      icon: 'groups',
      range: '18-65+'
    },
    {
      value: 'young' as AgeGroup,
      label: 'Young Adults',
      description: 'You are targeting people between 18-24 years',
      icon: 'school',
      range: '18-24'
    },
    {
      value: 'middle' as AgeGroup,
      label: 'Middle Age',
      description: 'You are targeting people between 25-44 years',
      icon: 'work',
      range: '25-44'
    },
    {
      value: 'advanced' as AgeGroup,
      label: 'Advanced Age',
      description: 'You are targeting people 45 years and above',
      icon: 'elderly',
      range: '45+'
    }
  ];

  ngOnInit(): void {
    // Ensure ageTarget control exists
    if (!this.formGroup.get('ageTarget')) {
      this.formGroup.addControl('ageTarget', new FormControl('all', Validators.required));
    }

    // Listen for form status changes to emit validity to the parent
    this.formGroup.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.validityChange.emit(this.formGroup.valid);
      });
      
    // Subscribe to the 'budget' control's value changes
    this.formGroup.get('budget')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(budget => {
        if (budget) {
          // Adjust estimated reach based on age targeting
          const ageMultiplier = this.getAgeMultiplier();
          this.estimatedReach = Math.floor((budget / 200) * 45 * ageMultiplier);
        } else {
          this.estimatedReach = 0;
        }
      });

    // Subscribe to age target changes to update estimated reach
    this.formGroup.get('ageTarget')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const budget = this.formGroup.get('budget')?.value;
        if (budget) {
          const ageMultiplier = this.getAgeMultiplier();
          this.estimatedReach = Math.floor((budget / 200) * 45 * ageMultiplier);
        }
      });
  }

  private getAgeMultiplier(): number {
    const ageTarget = this.formGroup.get('ageTarget')?.value;
    switch(ageTarget) {
      case 'all': return 1.0;
      case 'young': return 0.8;  // Smaller audience
      case 'middle': return 0.9; // Medium audience
      case 'advanced': return 0.7; // Smaller audience
      default: return 1.0;
    }
  }

  getSelectedAgeGroupDescription(): string {
    const selected = this.ageGroups.find(group => group.value === this.formGroup.get('ageTarget')?.value);
    return selected?.description || '';
  }
}