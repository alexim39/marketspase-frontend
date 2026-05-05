// faq-manager.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FAQ } from '../../models/assistant.model';
import { FaqFormComponent } from './faq-form/faq-form.component';
import { AiAssistantService } from '../../services/ai-assistant.service';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-faq-manager',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatDividerModule, FaqFormComponent],
  template: `
    <mat-card class="faq-card">
      <h3 class="card-title">Frequently Asked Questions</h3>
      <div *ngIf="faqs && faqs.length === 0" class="empty-state">
        <p>No FAQs yet. Add some below to train your AI.</p>
      </div>
      <div *ngFor="let faq of faqs" class="faq-item">
        <div class="faq-text">
          <strong>{{ faq.question }}</strong>
          <p>{{ faq.answer }}</p>
        </div>
        <button mat-icon-button color="warn" (click)="delete(faq.id)" aria-label="Delete FAQ">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
      <mat-divider class="divider"></mat-divider>
      <app-faq-form (faqAdded)="addFAQ($event)"></app-faq-form>
    </mat-card>
  `,
  styles: [`
    .faq-card {
      height: 100%;
      background: var(--surface-color);
    }
    .card-title { margin-bottom: 16px; }
    .faq-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 12px 0;
      border-bottom: 1px solid var(--divider-color);
    }
    .faq-text p { margin: 4px 0 0; color: var(--text-secondary); font-size: 0.85rem; }
    .divider { margin: 16px 0; }
    .empty-state { margin: 16px 0; color: var(--text-secondary); }
  `]
})
export class FaqManagerComponent {
  @Input() faqs: FAQ[] | null = [];

  constructor(private service: AiAssistantService) {}

  addFAQ(event: { question: string; answer: string }): void {
    this.service.addFaq({ question: event.question, answer: event.answer });
  }

  delete(id: string): void {
    this.service.deleteFaq(id);
  }
}