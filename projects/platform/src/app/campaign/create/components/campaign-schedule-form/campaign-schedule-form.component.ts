import { Component, Input, Output, EventEmitter, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-campaign-schedule-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    FormsModule
  ],
  templateUrl: './campaign-schedule-form.component.html',
  styleUrls: ['./campaign-schedule-form.component.scss']
})
export class CampaignScheduleFormComponent implements OnInit {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input({ required: true }) minStartDate!: Date;
  @Output() validityChange = new EventEmitter<boolean>();

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.setupFormValidation();
    this.setupDateCalculation();
  }

  private setupFormValidation(): void {
    this.formGroup.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.validityChange.emit(this.formGroup.valid));

    this.formGroup.get('hasEndDate')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(hasEndDate => {
        const endDateControl = this.formGroup.get('endDate');
        if (hasEndDate) {
          endDateControl?.setValidators(Validators.required);
          if (!endDateControl?.value) {
            endDateControl?.setValue(this.getDefaultEndDate());
          }
        } else {
          endDateControl?.clearValidators();
          endDateControl?.setValue(null);
        }
        endDateControl?.updateValueAndValidity();
      });
  }

  private setupDateCalculation(): void {
    this.formGroup.get('startDate')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateEndDateAndDuration());

    this.formGroup.get('endDate')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateEndDateAndDuration());
  }

  private updateEndDateAndDuration(): void {
    if (this.formGroup.get('hasEndDate')?.value) {
      const startDate = this.formGroup.get('startDate')?.value;
      const endDate = this.formGroup.get('endDate')?.value;

      if (startDate && endDate) {
        if (endDate < startDate) {
          this.formGroup.get('endDate')?.setErrors({ dateRange: true });
        } else {
          this.formGroup.get('endDate')?.setErrors(null);
        }
      }
    }
  }

  private getDefaultEndDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  }

  /**
   * Method to dynamically determine the slide-toggle's label.
   * This accesses the current value of the 'hasEndDate' FormControl.
   */
  getEndDateLabel(): string {
    const isChecked = this.formGroup.get('hasEndDate')?.value;
    
    // Ternary operation: (condition) ? value_if_true : value_if_false
    return isChecked ? 'Turn off end date' : 'Set an end date';
  }
}