export type GlobalSearchEntityType = 'user' | 'campaign' | 'promotion' | 'product' | 'store';

export interface GlobalSearchRegion {
  country: string;
  state: string;
  city: string;
  label: string;
}

export interface GlobalSearchResult {
  entityType: GlobalSearchEntityType;
  entityLabel: string;
  entityId: string;
  title: string;
  subtitle: string;
  description: string;
  status: string;
  userType: string;
  region: GlobalSearchRegion;
  primaryImage: string;
  isActive: boolean;
  relevanceScore: number;
  navigationPath: string;
  metadata: Record<string, any>;
}

export interface GlobalSearchPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GlobalSearchFacets {
  entityTypes: Record<string, number>;
  statuses: Record<string, number>;
  userTypes: Record<string, number>;
  regions: Record<string, number>;
}

export interface GlobalSearchPayload {
  query: string;
  pagination: GlobalSearchPagination;
  results: GlobalSearchResult[];
  facets: GlobalSearchFacets;
}

export interface GlobalSearchResponse {
  success: boolean;
  data: GlobalSearchPayload;
  message?: string;
}

export interface GlobalSearchFilters {
  types?: GlobalSearchEntityType[];
  userTypes?: string[];
  statuses?: string[];
  region?: string;
  page?: number;
  limit?: number;
}
