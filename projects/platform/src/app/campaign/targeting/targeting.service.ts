// targeting.service.ts (updated)
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, CampaignInterface, TargetingArea } from '../../../../../shared-services/src/public-api';

@Injectable()
export class CampaignTargetingService {
  private apiService: ApiService = inject(ApiService);
  public api = this.apiService.getBaseUrl();
  private apiUrl = 'campaign';

  getCampaignById(id: string): Observable<any> {
    return this.apiService.get<CampaignInterface>(`${this.apiUrl}/${id}`);
  }

  // New: Get only targeting data
  getCampaignTargeting(id: string): Observable<any> {
    return this.apiService.get<any>(`${this.apiUrl}/targeting/${id}`);
  }

  // Updated: Send only targeting data
  updateCampaignTargeting(id: string, userId: string, targetingData: any): Observable<any> {
    return this.apiService.put<any>(
      `${this.apiUrl}/targeting/${id}/${userId}`, 
      targetingData,
      undefined, 
      true
    );
  }

}