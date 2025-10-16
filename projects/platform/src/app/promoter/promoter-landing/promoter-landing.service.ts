import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../shared-services/src/public-api';

@Injectable()
export class PromoterLandingService {
  private readonly apiService: ApiService = inject(ApiService);
  public readonly api = this.apiService.getBaseUrl();
  private readonly apiUrl = 'promotion';
  private readonly apiUrl2 = 'campaign';

  
   /**
   * Get campaigns by status (e.g., active, paused, completed).
   * @param userId The campaign status to filter by.
   * @returns An observable of the filtered campaigns.
   */
  getUserPromotions(userId: string): Observable<any> {
    return this.apiService.get<any>(`${this.apiUrl}/user/${userId}`, undefined, undefined, true);
  }

/**
 * Get campaigns by status (e.g., active, paused, completed) with pagination.
 * @param status The campaign status to filter by.
 * @param userId The user id to target.
 * @param pagination Pagination options (page, limit).
 * @returns An observable of the filtered campaigns with pagination metadata.
 */
getCampaignsByStatus(
  status: string, 
  userId: string | undefined, 
  pagination: { page?: number; limit?: number } = {}
): Observable<any> {
  const { page = 1, limit = 20 } = pagination;
  
  // Build query string manually
  const queryParams = new URLSearchParams({
    status: status,
    userId: userId || '',
    page: page.toString(),
    limit: limit.toString()
  }).toString();
  
  return this.apiService.get<any>(
    `${this.apiUrl2}/?${queryParams}`, 
    undefined, 
    undefined, 
    true
  );
}


  // Promoter accept a campaign (Note: This might be the same as the download function)
  // Re-evaluating this based on your new controller, this function's logic might change.
  acceptCampaign(campaignId: string, userId: string): Observable<any> {
    return this.apiService.post<any>(`${this.apiUrl2}/${campaignId}/accept`, { userId }, undefined, true);
  }

}