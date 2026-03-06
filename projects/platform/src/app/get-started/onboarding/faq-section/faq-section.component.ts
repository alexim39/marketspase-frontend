import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'marketspase-faq-section',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterLink],
  templateUrl: './faq-section.component.html',
  styleUrls: ['./faq-section.component.scss']
})
export class FaqSectionComponent {
  @Input() faqItems: any[] = [];
  @Input() filteredFaqItems: any[] = [];
  @Input() categorizedFaqItems: any[] = [];
  @Input() categories: any[] = [];
  @Input() activeCategory: string = 'all';
  @Input() userRole: string = '';
  @Output() categoryChange = new EventEmitter<string>();

  trackByFaqQuestion(index: number, faq: any): string {
    return faq.question;
  }

  isRelevantFaq(faq: any): boolean {
    if (faq.target === 'both') return true;
    if (!this.userRole || this.userRole === '') return true;
    if (this.userRole === 'admin') return true;
    return faq.target === this.userRole;
  }

  setCategory(category: string) {
    this.categoryChange.emit(category);
  }
}