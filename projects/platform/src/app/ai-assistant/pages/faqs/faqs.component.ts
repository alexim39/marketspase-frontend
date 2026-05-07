import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AiAssistantService } from '../../services/ai-assistant.service';

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
}

@Component({
  selector: 'app-faqs',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    FormsModule
  ],
  templateUrl: './faqs.component.html',
  styleUrls: ['./faqs.component.scss'],
  providers: [AiAssistantService]
})
export class FaqsComponent implements OnInit, OnDestroy {
  private aiService = inject(AiAssistantService);
  private snackBar = inject(MatSnackBar);

  private destroy$ = new Subject<void>();

  faqs: FAQ[] = [];
  filteredFaqs: FAQ[] = [];
  editingFaq: FAQ | null = null;
  searchQuery = '';
  selectedCategory = '';
  
  newFaq = { question: '', answer: '', category: '', tags: '' };
  loading = false;
  saving = false;

  categories: string[] = [];

  ngOnInit(): void {
    this.loadFaqs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFaqs(): void {
    this.loading = true;
    this.aiService.getFaqs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (faqs) => {
          this.faqs = faqs;
          this.filteredFaqs = faqs;
          this.extractCategories();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Failed to load FAQs', 'Close', { duration: 5000 });
        }
      });
  }

  extractCategories(): void {
    const cats = new Set<string>();
    this.faqs.forEach(f => {
      if (f.category) cats.add(f.category);
    });
    this.categories = Array.from(cats).sort();
  }

  filterFaqs(): void {
    let result = this.faqs;
    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(f => 
        f.question.toLowerCase().includes(query) ||
        f.answer.toLowerCase().includes(query) ||
        f.tags?.some(t => t.toLowerCase().includes(query))
      );
    }
    
    if (this.selectedCategory) {
      result = result.filter(f => f.category === this.selectedCategory);
    }
    
    this.filteredFaqs = result;
  }

  addFaq(): void {
    if (!this.newFaq.question.trim() || !this.newFaq.answer.trim()) return;
    
    this.saving = true;
    const data = {
      ...this.newFaq,
      tags: this.newFaq.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    
    this.aiService.addFaq(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.newFaq = { question: '', answer: '', category: '', tags: '' };
          this.loadFaqs();
          this.saving = false;
          this.snackBar.open('FAQ added successfully', 'Close', { duration: 3000 });
        },
        error: () => {
          this.saving = false;
          this.snackBar.open('Failed to add FAQ', 'Close', { duration: 5000 });
        }
      });
  }

  startEdit(faq: FAQ): void {
    this.editingFaq = { 
      ...faq, 
      tags: faq.tags?.join(', ') || '' 
    } as any;
  }
  
  saveEdit(): void {
    if (!this.editingFaq) return;
    
    this.saving = true;
    const data = {
      question: this.editingFaq.question,
      answer: this.editingFaq.answer,
      category: this.editingFaq.category,
      tags: (this.editingFaq as any).tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    };
    
    this.aiService.updateFaq(this.editingFaq._id, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.editingFaq = null;
          this.loadFaqs();
          this.saving = false;
          this.snackBar.open('FAQ updated', 'Close', { duration: 3000 });
        },
        error: () => {
          this.saving = false;
          this.snackBar.open('Failed to update FAQ', 'Close', { duration: 5000 });
        }
      });
  }

  deleteFaq(id: string): void {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    
    this.aiService.deleteFaq(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadFaqs();
          this.snackBar.open('FAQ deleted', 'Close', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Failed to delete FAQ', 'Close', { duration: 5000 });
        }
      });
  }

  cancelEdit(): void {
    this.editingFaq = null;
  }

  // Create a helper to return the object as any
  get editingFaqAsAny(): any {
    return this.editingFaq;
  }

}