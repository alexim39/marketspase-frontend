import { inject, Injectable } from '@angular/core';
import { Observable, } from 'rxjs'; // Import BehaviorSubject and of for reactive state
import { ApiService } from '../../../../shared-services/src/public-api';


@Injectable()
export class PromoterService {
  private apiService: ApiService = inject(ApiService);
  public api = this.apiService.getBaseUrl();

 /**
 * Get campaigns by status (e.g., active, paused, completed).
 * @param status The campaign status to filter by.
 * @returns An observable of the filtered campaigns.
 */
  getCampaignsByStatus(status: string): Observable<any> {
    return this.apiService.get<any>(`campaign/?status=${status}`, undefined, undefined, true);
  }

  // Promoter accept a campaign
  acceptCampaign(campaignId: string, userId: string): Observable<any> {
    return this.apiService.post<any>(`campaign/${campaignId}/accept`, { userId }, undefined, true);
  }

  // 
  getUserPromotions(userId: string): Observable<any> {
    return this.apiService.get<any>(`campaign/promotions/user/${userId}`, undefined, undefined, true);
  }

  // submit promotion proofs
  submitProof(formData: FormData): Observable<any> {
    console.log(formData)
    return this.apiService.post<any>(`campaign/promotions/submit-proof`, formData, undefined, true);
  }

  // get submitted proofs
 /*  getProofDetails(promotionId: string): Observable<any> {
    return this.apiService.get<any>(`campaign/promotions/proof/${promotionId}`, undefined, undefined, true);
  } */

}
