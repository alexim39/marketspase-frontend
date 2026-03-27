// campaign.service.ts
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../shared-services/src/public-api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

@Injectable()
export class CampaignService {
  private apiService: ApiService = inject(ApiService);
  public api = this.apiService.getBaseUrl();
  private readonly apiBase = 'campaign/admin'
  private readonly apiBase2 = 'campaign'
  
  /**
   * Get campaigns with pagination and filters
   */
  getAppCampaigns(page: number = 1, limit: number = 50, filters?: any): Observable<any> {
    let url = `${this.apiBase}/campaigns?page=${page}&limit=${limit}`;
    
    // Add filters to URL if they exist
    if (filters) {
      if (filters.status && filters.status.length) {
        filters.status.forEach((status: string) => {
          url += `&status=${status}`;
        });
      }
      if (filters.category && filters.category.length) {
        filters.category.forEach((category: string) => {
          url += `&category=${category}`;
        });
      }
      if (filters.search) {
        url += `&search=${filters.search}`;
      }
    }
    
    return this.apiService.get<any>(url, undefined, undefined, true);
  }

  getCampaignById(id: string): Observable<ApiResponse<any>> {
    return this.apiService.get<ApiResponse<any>>(`${this.apiBase2}/${id}`, undefined, undefined, true);
  }

  updateCampaignStatus(id: string, status: string, performedBy: string): Observable<ApiResponse<any>> {
    return this.apiService.patch<ApiResponse<any>>(`${this.apiBase}/${id}/status`, { status, performedBy }, undefined, true);
  }

  updatePromotionStatus(id: string, status: string, performedBy: string, rejectionReason: string = ''): Observable<ApiResponse<any>> {
    return this.apiService.patch<ApiResponse<any>>(`${this.apiBase}/promotion/${id}/status/${performedBy}`, { status, rejectionReason });
  }
}