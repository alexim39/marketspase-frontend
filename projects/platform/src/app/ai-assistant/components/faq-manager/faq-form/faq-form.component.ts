// faq-form.component.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-faq-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <form [formGroup]="faqForm" (ngSubmit)="onSubmit()" class="faq-form">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Question</mat-label>
        <input matInput formControlName="question" placeholder="e.g., What are your delivery hours?">
        <mat-error *ngIf="faqForm.get('question')?.hasError('required')">Question is required</mat-error>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Answer</mat-label>
        <input matInput formControlName="answer" placeholder="Provide a clear answer">
        <mat-error *ngIf="faqForm.get('answer')?.hasError('required')">Answer is required</mat-error>
      </mat-form-field>
      <button mat-raised-button color="primary" type="submit" [disabled]="faqForm.invalid">
        Add FAQ
      </button>
    </form>
  `,
  styles: [`
    .faq-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .full-width { width: 100%; }
  `]
})
export class FaqFormComponent {
  @Output() faqAdded = new EventEmitter<{ question: string; answer: string }>();

  faqForm: any;

  constructor(private fb: FormBuilder) {
    this.faqForm = this.fb.group({
      question: ['', Validators.required],
      answer: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.faqForm.valid) {
      this.faqAdded.emit(this.faqForm.value as { question: string; answer: string });
      this.faqForm.reset();
    }
  }
}