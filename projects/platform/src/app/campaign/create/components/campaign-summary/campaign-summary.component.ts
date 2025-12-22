import { Component, input, computed, inject, Signal } from '@angular/core'; // Added 'input'
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FormGroup } from '@angular/forms';
import { MediaFile } from '../../media-file.model';
import { toSignal, toObservable } from '@angular/core/rxjs-interop'; // Added 'toObservable'
import { ShortNumberPipe } from '../../../../common/pipes/short-number.pipe';
import { startWith, switchMap } from 'rxjs/operators';

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

  public slots = computed(() => {
    const budget = this.budgetValue() || 0;
    return Math.floor(budget / 200);
  });

  public estimatedReach = computed(() => {
    return this.slots() * 45;
  });
}