import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PromotionInterface } from '../../../../shared-services/src/public-api';
import { HttpParams } from '@angular/common/http';

@Injectable()
export class PromoterService {
  private readonly apiService: ApiService = inject(ApiService);
  public readonly api = this.apiService.getBaseUrl();

  /**
   * Get campaigns by status (e.g., active, paused, completed).
   * @param status The campaign status to filter by.
   * @returns An observable of the filtered campaigns.
   */
  getCampaignsByStatus(status: string): Observable<any> {
    return this.apiService.get<any>(`campaign/?status=${status}`, undefined, undefined, true);
  }

  /**
   * Get campaigns by status (e.g., active, paused, completed).
   * @param id The campaign status to filter by.
   * @returns An observable of the filtered campaigns.
   */
  getPromotionById(id: string, userId: string): Observable<any> {
    return this.apiService.get<any>(`promotion/${id}/${userId}`, undefined, undefined, true);
  }

  // Promoter accept a campaign (Note: This might be the same as the download function)
  // Re-evaluating this based on your new controller, this function's logic might change.
  acceptCampaign(campaignId: string, userId: string): Observable<any> {
    return this.apiService.post<any>(`campaign/${campaignId}/accept`, { userId }, undefined, true);
  }

  // Get user's promotions with pagination and filtering
  getUserPromotions(
    userId: string,
    filters?: {
      status?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Observable<{
    success: boolean;
    data: PromotionInterface[];
    totalPages: number;
    currentPage: number;
    total: number;
  }> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    }

    return this.apiService.get<any>(`promotion/user/${userId}`, params, undefined, true);
  }

  // Submit promotion proofs
  submitProof(formData: FormData, userId: string): Observable<any> {
    return this.apiService.post<any>(`promotion/submit-proof/${userId}`, formData, undefined, true);
  }

  /**
   * @description Calls the backend endpoint to download a promotion media.
   * This action registers the promoter for the campaign.
   * @param campaignId The ID of the campaign to download.
   * @param promoterId The ID of the promoter.
   * @returns An Observable of the API response, which contains the campaign media URL and type.
   */
  downloadPromotion(campaignId: string, promoterId: string, promotionId: string): Observable<any> {
    const payload = {
      campaignId,
      promoterId,
      promotionId
    };
    return this.apiService.post<any>('promotion/download', payload, undefined, true);
  }
}

