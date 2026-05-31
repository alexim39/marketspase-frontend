import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  Input,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { GlobalSearchResult } from './global-search.model';
import { GlobalSearchService } from './global-search.service';

@Component({
  selector: 'app-global-search-bar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './global-search-bar.component.html',
  styleUrl: './global-search-bar.component.scss',
})
export class GlobalSearchBarComponent {
  @Input() compact = false;

  private readonly router = inject(Router);
  private readonly searchService = inject(GlobalSearchService);
  private readonly destroyRef = inject(DestroyRef);
  private latestSuggestionRequestId = 0;
  readonly loadingPlaceholders = [0, 1, 2];

  readonly queryControl = new FormControl('', { nonNullable: true });
  readonly query = signal('');
  readonly suggestions = signal<GlobalSearchResult[]>([]);
  readonly isLoading = signal(false);
  readonly isFocused = signal(false);
  readonly hasSettledSuggestions = signal(false);

  readonly queryValue = computed(() => this.query().trim());
  readonly queryLength = computed(() => this.queryValue().length);
  readonly hasQuery = computed(() => this.queryLength() > 0);
  readonly canRunSuggestions = computed(() => this.queryLength() >= 2);
  readonly showSuggestions = computed(() =>
    this.isFocused() &&
    this.hasQuery()
  );

  constructor() {
    this.syncQueryFromUrl();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.syncQueryFromUrl());

    this.queryControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.query.set(value);
        this.prepareSuggestionState(value);
      });

    this.queryControl.valueChanges
      .pipe(
        debounceTime(120),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => this.fetchSuggestions(value));
  }

  submitSearch(): void {
    const query = this.queryControl.value.trim();
    if (!query) {
      return;
    }

    this.closeSuggestions();
    this.router.navigate(['/dashboard/search'], {
      queryParams: { q: query, page: 1 },
    });
  }

  openResult(result: GlobalSearchResult): void {
    this.closeSuggestions();
    if (result.navigationPath) {
      this.router.navigateByUrl(result.navigationPath);
      return;
    }

    this.router.navigate(['/dashboard/search'], {
      queryParams: { q: this.queryControl.value.trim(), page: 1 },
    });
  }

  clearQuery(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.queryControl.setValue('');
    this.suggestions.set([]);
    this.hasSettledSuggestions.set(false);
    if (this.isSearchRoute()) {
      this.router.navigate(['/dashboard/search'], { queryParams: {} });
    }
  }

  handleFocus(): void {
    this.isFocused.set(true);
  }

  handleBlur(): void {
    setTimeout(() => {
      this.isFocused.set(false);
    }, 160);
  }

  viewAllResults(): void {
    this.submitSearch();
  }

  getEntityIcon(result: GlobalSearchResult): string {
    switch (result.entityType) {
      case 'campaign':
        return 'campaign';
      case 'promotion':
        return 'local_offer';
      case 'product':
        return 'inventory_2';
      case 'store':
        return 'storefront';
      case 'user':
      default:
        return 'person';
    }
  }

  private prepareSuggestionState(rawValue: string): void {
    const query = rawValue.trim();

    if (!query) {
      this.latestSuggestionRequestId += 1;
      this.isLoading.set(false);
      this.suggestions.set([]);
      this.hasSettledSuggestions.set(false);
      return;
    }

    if (!this.isFocused()) {
      this.isFocused.set(true);
    }

    if (query.length < 2) {
      this.latestSuggestionRequestId += 1;
      this.isLoading.set(false);
      this.suggestions.set([]);
      this.hasSettledSuggestions.set(false);
      return;
    }

    this.isLoading.set(true);
    this.suggestions.set([]);
    this.hasSettledSuggestions.set(false);
  }

  private fetchSuggestions(rawValue: string): void {
    const query = rawValue.trim();
    if (query.length < 2) {
      this.latestSuggestionRequestId += 1;
      this.isLoading.set(false);
      this.suggestions.set([]);
      this.hasSettledSuggestions.set(false);
      return;
    }

    const requestId = ++this.latestSuggestionRequestId;

    this.searchService.getSuggestions(query, { limit: 8 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (requestId !== this.latestSuggestionRequestId) {
            return;
          }
          this.suggestions.set(response.data?.results || []);
          this.isLoading.set(false);
          this.hasSettledSuggestions.set(true);
        },
        error: () => {
          if (requestId !== this.latestSuggestionRequestId) {
            return;
          }
          this.suggestions.set([]);
          this.isLoading.set(false);
          this.hasSettledSuggestions.set(true);
        },
      });
  }

  private syncQueryFromUrl(): void {
    const tree = this.router.parseUrl(this.router.url);
    const routeQuery = String(tree.queryParams['q'] || '').trim();
    if (routeQuery !== this.queryControl.value) {
      this.queryControl.setValue(routeQuery, { emitEvent: false });
    }
    this.query.set(routeQuery);
  }

  private closeSuggestions(): void {
    this.isFocused.set(false);
  }

  private isSearchRoute(): boolean {
    return this.router.url.startsWith('/dashboard/search');
  }
}
