import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, CampaignInterface } from '../../../../../shared-services/src/public-api';

@Injectable()
export class CampaignTargetingService {
  private apiService: ApiService = inject(ApiService);
  public api = this.apiService.getBaseUrl();
  private apiUrl = 'campaign';

  getCampaignById(id: string): Observable<any> {
    return this.apiService.get<CampaignInterface>(`${this.apiUrl}/${id}`);
  }

  updateCampaign(id: string, userId: string, campaignData: any): Observable<any> {
    console.log('id ', id, 'and userid ', userId, 'and campaign data ', campaignData)
    return this.apiService.put<any>(
      `${this.apiUrl}/edit/${id}/${userId}`, 
      campaignData, 
      undefined, 
      true
    );
  }
}