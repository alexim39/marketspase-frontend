import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, CampaignInterface } from '../../../../../shared-services/src/public-api';

@Injectable()
export class CampaignEditService {
  private apiService: ApiService = inject(ApiService);
  public api = this.apiService.getBaseUrl();
  private apiUrl = 'campaign';

  /**
   * Get campaign by ID
   */
  getCampaignById(id: string): Observable<any> {
    return this.apiService.get<CampaignInterface>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update campaign general details (excluding targeting)
   */
  updateCampaign(id: string, userId: string, campaignData: any): Observable<any> {
    return this.apiService.put<any>(
      `${this.apiUrl}/edit/${id}/${userId}`, 
      campaignData, 
      undefined, 
      true
    );
  }

  /**
   * Partial update for specific fields
   */
  updateCampaignPartial(id: string, userId: string, campaignData: any): Observable<any> {
    return this.apiService.patch<any>(
      `${this.apiUrl}/edit/${id}/${userId}`, 
      campaignData, 
      undefined, 
      true
    );
  }



  /**
   * Get campaign targeting settings
   */
  getCampaignTargeting(id: string): Observable<any> {
    return this.apiService.get<any>(`${this.apiUrl}/targeting/${id}`);
  }
}