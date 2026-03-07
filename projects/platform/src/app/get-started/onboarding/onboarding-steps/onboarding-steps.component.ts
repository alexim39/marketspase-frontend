import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
//import { OnboardingStep } from '../get-started.component'; // adjust path if needed

 interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  action?: string;
  actionLink?: string;
  completed: boolean;
}

@Component({
  selector: 'marketspase-onboarding-steps',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './onboarding-steps.component.html',
  styleUrls: ['./onboarding-steps.component.scss']
})
export class OnboardingStepsComponent {
  @Input() steps: OnboardingStep[] = [];
  @Input() role: string = '';
  @Output() navigate = new EventEmitter<OnboardingStep>();

  trackByStepId(index: number, step: OnboardingStep): number {
    return step.id;
  }

  getButtonColor(): string {
    return this.role === 'promoter' ? 'accent' : 'primary';
  }

  isCurrentStep(step: OnboardingStep, index: number): boolean {
    return !step.completed && (index === 0 || this.steps[index - 1]?.completed);
  }
}