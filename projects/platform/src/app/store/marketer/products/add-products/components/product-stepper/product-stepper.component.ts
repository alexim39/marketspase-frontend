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
  templateUrl: './product-stepper.component.html',
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