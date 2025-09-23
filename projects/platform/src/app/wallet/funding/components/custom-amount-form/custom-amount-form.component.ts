import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'custom-amount-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './custom-amount-form.component.html',
  styleUrls: ['./custom-amount-form.component.scss']
})
export class CustomAmountFormComponent {
  @Input() form!: FormGroup;
  @Input() minAmount: number = 0;
  @Input() maxAmount: number = 0;
  @Input() disabled: boolean = false;
  @Output() amountChange = new EventEmitter<Event>();
  @Output() clearSelection = new EventEmitter<void>();

  onInputChange(event: Event): void {
    this.amountChange.emit(event);
  }

  onFocus(): void {
    this.clearSelection.emit();
  }
}