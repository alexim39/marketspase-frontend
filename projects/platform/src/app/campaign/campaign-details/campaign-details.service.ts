import { inject, Injectable } from '@angular/core';
import { Observable, } from 'rxjs'; 
import { ApiService, CampaignInterface, } from '../../../../../shared-services/src/public-api';


@Injectable()
export class CampaignDetailsService {
  private readonly apiService: ApiService = inject(ApiService);
  public readonly api = this.apiService.getBaseUrl();
  private readonly apiUrl = 'campaign';


   /**
 * Get campaigns by id (e.g., active, paused, completed).
 * @param status The campaign status to filter by.
 * @returns An observable of the filtered campaigns.
 */
  getCampaignById(id: string): Observable<any> {
    return this.apiService.get<CampaignInterface>(`${this.apiUrl}/${id}`);
  }

  updateCampaignStatus(id: string, status: string, performedBy: string): Observable<any> {
    return this.apiService.patch<any>(`campaign/admin/${id}/status`, { status, performedBy }, undefined, true);
  }
}
