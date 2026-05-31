import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { AiAssistantService } from '../../services/ai-assistant.service';

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
}

export interface FaqDraft {
  question: string;
  answer: string;
  category: string;
  tagsText: string;
}

export interface EditingFaqDraft extends FaqDraft {
  _id: string;
}

@Component({
  selector: 'app-faqs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class FaqsComponent implements OnInit {
  protected aiService = inject(AiAssistantService);
  protected snackBar = inject(MatSnackBar);
  protected destroyRef = inject(DestroyRef);

  readonly faqs = signal<FAQ[]>([]);
  readonly editingFaq = signal<EditingFaqDraft | null>(null);
  readonly searchQuery = signal('');
  readonly selectedCategory = signal('');
  readonly newFaq = signal<FaqDraft>(this.createEmptyDraft());
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly categories = computed(() => {
    const categorySet = new Set(
      this.faqs()
        .map(faq => faq.category?.trim())
        .filter((category): category is string => !!category)
    );

    return Array.from(categorySet).sort((left, right) => left.localeCompare(right));
  });
  readonly filteredFaqs = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const selectedCategory = this.selectedCategory();

    return this.faqs().filter(faq => {
      const matchesQuery = !query
        || faq.question.toLowerCase().includes(query)
        || faq.answer.toLowerCase().includes(query)
        || faq.tags?.some(tag => tag.toLowerCase().includes(query));
      const matchesCategory = !selectedCategory || faq.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  });

  ngOnInit(): void {
    this.loadFaqs();
  }

  loadFaqs(): void {
    this.loading.set(true);
    this.aiService.getFaqs()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (faqs) => {
          this.faqs.set(faqs as FAQ[]);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Failed to load FAQs', 'Close', { duration: 5000 });
        }
      });
  }

  selectCategory(category = ''): void {
    this.selectedCategory.set(category);
  }

  updateNewFaq(field: keyof FaqDraft, value: string): void {
    this.newFaq.update(draft => ({ ...draft, [field]: value }));
  }

  addFaq(): void {
    const draft = this.newFaq();
    if (!draft.question.trim() || !draft.answer.trim()) return;

    this.saving.set(true);
    const data = {
      question: draft.question.trim(),
      answer: draft.answer.trim(),
      category: draft.category.trim(),
      tags: this.parseTags(draft.tagsText),
    };

    this.aiService.addFaq(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.newFaq.set(this.createEmptyDraft());
          this.loadFaqs();
          this.saving.set(false);
          this.snackBar.open('FAQ added successfully', 'Close', { duration: 3000 });
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Failed to add FAQ', 'Close', { duration: 5000 });
        }
      });
  }

  startEdit(faq: FAQ): void {
    this.editingFaq.set({
      _id: faq._id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
      tagsText: faq.tags?.join(', ') || '',
    });
  }

  updateEditingFaq(field: keyof FaqDraft, value: string): void {
    this.editingFaq.update(faq => faq ? { ...faq, [field]: value } : faq);
  }
  
  saveEdit(): void {
    const editingFaq = this.editingFaq();
    if (!editingFaq) return;

    this.saving.set(true);
    const data = {
      question: editingFaq.question.trim(),
      answer: editingFaq.answer.trim(),
      category: editingFaq.category.trim(),
      tags: this.parseTags(editingFaq.tagsText),
    };

    this.aiService.updateFaq(editingFaq._id, data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.editingFaq.set(null);
          this.loadFaqs();
          this.saving.set(false);
          this.snackBar.open('FAQ updated', 'Close', { duration: 3000 });
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Failed to update FAQ', 'Close', { duration: 5000 });
        }
      });
  }

  deleteFaq(id: string): void {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    this.removeFaq(id);
  }

  protected removeFaq(id: string): void {
    this.aiService.deleteFaq(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
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
    this.editingFaq.set(null);
  }

  protected createEmptyDraft(): FaqDraft {
    return { question: '', answer: '', category: '', tagsText: '' };
  }

  protected parseTags(value: string): string[] {
    return value.split(',').map(tag => tag.trim()).filter(Boolean);
  }
}
