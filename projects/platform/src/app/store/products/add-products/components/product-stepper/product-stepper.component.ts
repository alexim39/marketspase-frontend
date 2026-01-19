// components/product-management/add-product/components/product-stepper/product-stepper.component.ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-product-stepper',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <mat-stepper [linear]="true" [selectedIndex]="currentStep()" class="product-stepper">
      @for (step of stepLabels(); track $index; let i = $index) {
        <mat-step [completed]="i < currentStep()">
          <ng-template matStepLabel>{{ step }}</ng-template>
        </mat-step>
      }
    </mat-stepper>

    <div class="stepper-navigation">
      <button mat-stroked-button (click)="previous.emit()" [disabled]="currentStep() === 0">
        <mat-icon>arrow_back</mat-icon>
        Previous
      </button>
      
      <div class="step-indicator">
        <span>Step {{ currentStep() + 1 }} of {{ stepLabels().length }}</span>
        <mat-progress-bar 
          mode="determinate" 
          [value]="((currentStep() + 1) / stepLabels().length) * 100"
          color="primary">
        </mat-progress-bar>
      </div>
      
      @if (currentStep() < stepLabels().length - 1) {
        <button mat-raised-button color="primary" (click)="next.emit()" [disabled]="!isStepValid()">
          Next
          <mat-icon>arrow_forward</mat-icon>
        </button>
      } @else {
        <button mat-raised-button color="primary" (click)="submit.emit()" [disabled]="loading()">
          @if (loading()) {
            <mat-progress-spinner diameter="20" mode="indeterminate"></mat-progress-spinner>
            <span>Saving...</span>
          } @else {
            <mat-icon>save</mat-icon>
            <span>Save Product</span>
          }
        </button>
      }
    </div>
  `,
  styleUrls: ['./product-stepper.component.scss']
})
export class ProductStepperComponent {
  currentStep = input<number>(0);
  stepLabels = input<string[]>([]);
  isStepValid = input<boolean>(true);
  loading = input<boolean>(false);
  
  previous = output<void>();
  next = output<void>();
  submit = output<void>();
}