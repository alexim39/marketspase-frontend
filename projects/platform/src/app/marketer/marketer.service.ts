import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../shared-services/src/public-api';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface FilterParams {
  status?: string;
  category?: string;
  campaignType?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  message: string;
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCampaigns: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
}

@Injectable()
export class MarketerService {
  private readonly apiService: ApiService = inject(ApiService);
  public readonly api = this.apiService.getBaseUrl();
  private readonly apiUrl = 'campaign';

  /**
   * Get campaigns for a marketer with pagination and filtering
   * @param userId - The marketer's user ID
   * @param pagination - Pagination parameters (page and limit)
   * @param filters - Filter parameters (status, search, etc.)
   * @returns An observable of the paginated campaigns response
   */
  getMarketerCampaign(
    userId: string, 
    pagination?: PaginationParams,
    filters?: FilterParams
  ): Observable<PaginatedResponse<any>> {
    const params: any = {};
    
    // Add pagination parameters if provided
    if (pagination?.page) {
      params.page = pagination.page.toString();
    }
    if (pagination?.limit) {
      params.limit = pagination.limit.toString();
    }

    // Add filter parameters if provided
    if (filters?.status && filters.status !== 'all') {
      params.status = filters.status;
    }
    if (filters?.search) {
      params.search = filters.search;
    }
    if (filters?.category) {
      params.category = filters.category;
    }
    if (filters?.campaignType) {
      params.campaignType = filters.campaignType;
    }
    if (filters?.sortBy) {
      params.sortBy = filters.sortBy;
    }
    if (filters?.sortOrder) {
      params.sortOrder = filters.sortOrder;
    }

    return this.apiService.get<PaginatedResponse<any>>(
      `${this.apiUrl}/user/${userId}`,
      params, // Pass both pagination and filter parameters as query params
      undefined, 
      true
    );
  }
}