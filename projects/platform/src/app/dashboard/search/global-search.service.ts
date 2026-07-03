import { inject, Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api';
import {
  GlobalSearchEntityType,
  GlobalSearchFilters,
  GlobalSearchResponse,
  GlobalSearchResult,
} from './global-search.model';

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  private readonly apiService = inject(ApiService);

  search(query: string, filters: GlobalSearchFilters = {}): Observable<GlobalSearchResponse> {
    return this.apiService.get<GlobalSearchResponse>(
      'api/v1/search',
      this.buildParams(query, filters),
      undefined,
      true,
    );
  }

  getSuggestions(query: string, filters: GlobalSearchFilters = {}): Observable<GlobalSearchResponse> {
    return this.apiService.get<GlobalSearchResponse>(
      'api/v1/search/suggestions',
      this.buildParams(query, {
        ...filters,
        page: 1,
        limit: Math.min(filters.limit || 8, 12),
      }),
      undefined,
      true,
    );
  }

  exportResults(results: GlobalSearchResult[], query: string): void {
    const header = [
      'Type',
      'Title',
      'Subtitle',
      'Status',
      'User Type',
      'Region',
      'Path',
    ];

    const rows = results.map((result) => ([
      result.entityLabel,
      result.title,
      result.subtitle,
      result.status,
      result.userType,
      result.region?.label || '',
      result.navigationPath,
    ]));

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const safeQuery = (query || 'marketspase-search')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    anchor.href = url;
    anchor.download = `marketspase-search-${safeQuery || 'results'}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  formatEntityLabel(entityType: GlobalSearchEntityType): string {
    switch (entityType) {
      case 'campaign':
        return 'Campaign';
      case 'promotion':
        return 'Promotion';
      case 'product':
        return 'Product';
      case 'store':
        return 'Store';
      case 'user':
      default:
        return 'User';
    }
  }

  private buildParams(query: string, filters: GlobalSearchFilters): HttpParams {
    let params = new HttpParams().set('q', query || '');

    if (filters.types?.length) {
      params = params.set('types', filters.types.join(','));
    }

    if (filters.userTypes?.length) {
      params = params.set('userTypes', filters.userTypes.join(','));
    }

    if (filters.statuses?.length) {
      params = params.set('statuses', filters.statuses.join(','));
    }

    if (filters.region?.trim()) {
      params = params.set('region', filters.region.trim());
    }

    if (filters.page) {
      params = params.set('page', String(filters.page));
    }

    if (filters.limit) {
      params = params.set('limit', String(filters.limit));
    }

    return params;
  }
}
