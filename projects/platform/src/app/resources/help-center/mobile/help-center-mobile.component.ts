import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { startWith } from 'rxjs/operators';
import { HeaderComponent } from '../../core/header/header.component';
import { FooterComponent } from '../../core/footer/footer.component';
import {
  Article,
  ContactOption,
  FAQ,
  HelpCategory,
  HelpCenterComponent,
} from '../help-center.component';

type HelpSheet = 'article' | 'faq' | 'contact' | null;

@Component({
  selector: 'app-help-center-mobile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatIconModule,
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: './help-center-mobile.component.html',
  styleUrls: ['./help-center-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpCenterMobileComponent extends HelpCenterComponent {
  readonly selectedCategoryId = signal('getting-started');
  readonly activeSheet = signal<HelpSheet>(null);
  readonly selectedArticle = signal<Article | null>(null);
  readonly selectedFaq = signal<FAQ | null>(null);
  readonly selectedContact = signal<ContactOption | null>(null);

  private readonly searchValue = toSignal(
    this.searchControl.valueChanges.pipe(startWith(this.searchControl.value ?? '')),
    { initialValue: '' }
  );

  readonly query = computed(() => String(this.searchValue() || '').trim().toLowerCase());

  readonly totalArticleCount = computed(() =>
    this.helpCategories().reduce((total, category) => total + category.articleCount, 0)
  );

  readonly selectedCategory = computed(() => {
    const categoryId = this.selectedCategoryId();
    return this.helpCategories().find((category) => category.id === categoryId) || this.helpCategories()[0];
  });

  readonly visibleArticles = computed(() => {
    const query = this.query();
    const category = this.selectedCategory();
    const articles = this.featuredArticles();

    const matches = articles.filter((article) => {
      const searchable = [
        article.title,
        article.excerpt,
        article.category,
        ...article.tags,
      ].join(' ').toLowerCase();

      if (query) {
        return searchable.includes(query);
      }

      return article.category.toLowerCase() === category?.name.toLowerCase() || article.featured;
    });

    return (matches.length ? matches : articles).slice(0, 6);
  });

  readonly visibleFaqs = computed(() => {
    const query = this.query();
    const categoryId = this.selectedCategoryId();
    const faqs = this.faqs();

    if (query) {
      return faqs.filter((faq) => {
        const searchable = [
          faq.question,
          faq.answer.replace(/<[^>]*>/g, ' '),
          ...faq.tags,
        ].join(' ').toLowerCase();

        return searchable.includes(query);
      }).slice(0, 8);
    }

    const categoryFaqs = this.getCategoryFAQs(categoryId);
    return (categoryFaqs.length ? categoryFaqs : faqs.filter((faq) => faq.popular)).slice(0, 6);
  });

  readonly quickActions = computed(() => this.contactOptions().slice(0, 3));

  selectCategory(category: HelpCategory): void {
    this.selectedCategoryId.set(category.id);
  }

  applySearchTag(tag: string): void {
    this.searchByTag(tag);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  openArticleSheet(article: Article): void {
    this.selectedArticle.set(article);
    this.selectedFaq.set(null);
    this.selectedContact.set(null);
    this.activeSheet.set('article');
  }

  openFaqSheet(faq: FAQ): void {
    this.selectedFaq.set(faq);
    this.selectedArticle.set(null);
    this.selectedContact.set(null);
    this.activeSheet.set('faq');
  }

  openContactSheet(option?: ContactOption): void {
    this.selectedContact.set(option || this.contactOptions()[0] || null);
    this.selectedArticle.set(null);
    this.selectedFaq.set(null);
    this.activeSheet.set('contact');
  }

  closeSheet(): void {
    this.activeSheet.set(null);
  }

  runContactAction(): void {
    const contact = this.selectedContact();
    if (!contact) return;
    this.initiateContact(contact.title);
  }

  openSelectedArticle(): void {
    const article = this.selectedArticle();
    if (!article) return;
    this.openArticle(article.id);
  }

  articleSteps(article: Article): string[] {
    if (article.steps?.length) {
      return article.steps;
    }

    return [
      'Review the summary and related tags.',
      'Apply the steps inside your MarketSpase dashboard.',
      'Contact support if the issue still affects your account.',
    ];
  }

  categoryTone(index: number): string {
    return ['tone-blue', 'tone-green', 'tone-amber', 'tone-rose', 'tone-cyan', 'tone-slate'][index % 6];
  }
}
