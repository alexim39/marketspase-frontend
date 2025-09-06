import { inject, Injectable } from '@angular/core';
import { Observable, } from 'rxjs'; // Import BehaviorSubject and of for reactive state
import { ApiService } from '../../../../shared-services/src/public-api';


@Injectable()
export class CampaignService {
  private apiService: ApiService = inject(ApiService);
  public api = this.apiService.getBaseUrl();
  

  /**
   * Submits the user data to the backend API.
   * @post campaignObject The user data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  create(campaignData: FormData): Observable<any> {
    // We send a stripped-down version of the data to the backend.
    // const payload = {
    //   title: campaignData.title,
    //   caption: campaignData.caption,
    //   link: campaignData.link,
    //   category: campaignData.category,
    //   budget: campaignData.budget,
    //   startDate: campaignData.startDate,
    //   endDate: campaignData.hasEndDate ? campaignData.endDate : null,
    //   mediaUrl: campaignData.mediaUrl,
    //   currency: campaignData.currency,
    //   owner: campaignData.owner
    // };

    return this.apiService.post<any>(`campaign/create`, campaignData, undefined, true);
  }


  /**
   * Get the form data to the backend.
   * @returns An observable of the submitted form data.
  */
  getAdvertiserCampaign(userId: string): Observable<any> {
    return this.apiService.get<any>(`campaign/user/${userId}`, undefined, undefined, true);
  }

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
  getProofDetails(promotionId: string): Observable<any> {
    return this.apiService.get<any>(`campaign/promotions/proof/${promotionId}`, undefined, undefined, true);
  }

}
