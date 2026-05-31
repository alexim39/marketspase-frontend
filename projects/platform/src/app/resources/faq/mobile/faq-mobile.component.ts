import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { startWith } from 'rxjs/operators';
import { HeaderComponent } from '../../core/header/header.component';
import { FooterComponent } from '../../core/footer/footer.component';
import { FAQ, FAQCategory, FAQComponent, PopularQuestion } from '../faq.component';

type FAQSheet = 'answer' | 'popular' | 'support' | null;

@Component({
  selector: 'app-faq-mobile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatIconModule,
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: './faq-mobile.component.html',
  styleUrls: ['./faq-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FAQMobileComponent extends FAQComponent {
  readonly activeSheet = signal<FAQSheet>(null);
  readonly selectedFaq = signal<FAQ | null>(null);
  readonly selectedPopularQuestion = signal<PopularQuestion | null>(null);

  private readonly searchValue = toSignal(
    this.searchControl.valueChanges.pipe(startWith(this.searchControl.value ?? '')),
    { initialValue: '' }
  );

  readonly query = computed(() => String(this.searchValue() || '').trim().toLowerCase());

  readonly selectedCategory = computed(() => {
    const categoryId = this.activeCategory();
    return this.categories().find((category) => category.id === categoryId) || this.categories()[0];
  });

  readonly totalQuestionCount = computed(() =>
    this.categories().reduce((total, category) => total + category.count, 0)
  );

  readonly filteredFaqs = computed(() => {
    const query = this.query();
    const faqs = this.faqs();

    if (query) {
      return faqs.filter((faq) => {
        const searchable = [
          faq.question,
          faq.answer.replace(/<[^>]*>/g, ' '),
          faq.category,
          ...(faq.tags || []),
        ].join(' ').toLowerCase();

        return searchable.includes(query);
      }).slice(0, 10);
    }

    const categoryFaqs = this.getCategoryFAQs(this.activeCategory());
    return (categoryFaqs.length ? categoryFaqs : faqs.filter((faq) => faq.popular)).slice(0, 8);
  });

  readonly featuredMobileQuestions = computed(() => {
    const featured = this.featuredQuestions();
    return (featured.length ? featured : this.faqs().filter((faq) => faq.popular)).slice(0, 4);
  });

  selectCategory(category: FAQCategory): void {
    this.activeCategory.set(category.id);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  applySearchTag(tag: string): void {
    this.searchByTag(tag);
  }

  openFaqSheet(faq: FAQ): void {
    this.selectedFaq.set(faq);
    this.selectedPopularQuestion.set(null);
    this.activeSheet.set('answer');
    this.onPanelOpened(faq.id);
  }

  openPopularSheet(question: PopularQuestion): void {
    this.selectedPopularQuestion.set(question);
    this.selectedFaq.set(null);
    this.activeSheet.set('popular');
  }

  openSupportSheet(): void {
    this.selectedFaq.set(null);
    this.selectedPopularQuestion.set(null);
    this.activeSheet.set('support');
  }

  closeSheet(): void {
    this.activeSheet.set(null);
  }

  voteHelpful(): void {
    const faq = this.selectedFaq();
    if (!faq) return;
    this.markHelpful(faq.id);
  }

  voteNotHelpful(): void {
    const faq = this.selectedFaq();
    if (!faq) return;
    this.markNotHelpful(faq.id);
  }

  categoryTone(index: number): string {
    return ['tone-blue', 'tone-purple', 'tone-cyan', 'tone-green', 'tone-amber', 'tone-red'][index % 6];
  }
}
