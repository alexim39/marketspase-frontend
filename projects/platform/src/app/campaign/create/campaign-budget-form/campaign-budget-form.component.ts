import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ShortNumberPipe } from '../../../common/pipes/short-number.pipe';

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
    ShortNumberPipe
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
  
  // Change estimatedReach from a computed signal to a normal property
  public estimatedReach = 0;

  ngOnInit(): void {
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
          // Calculate the estimated reach based on the new budget value
          this.estimatedReach = Math.floor((budget / 200) * 30);
        } else {
          this.estimatedReach = 0;
        }
      });
  }
}