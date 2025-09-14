import { inject, Injectable } from '@angular/core';
import { Observable, } from 'rxjs'; // Import BehaviorSubject and of for reactive state
import { ApiService, CampaignInterface, PromotionInterface } from '../../../../shared-services/src/public-api';


@Injectable()
export class MarketerService {
  private apiService: ApiService = inject(ApiService);
  public api = this.apiService.getBaseUrl();
  private apiUrl = 'campaign';

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
   * Submits the user data to the backend API.
   * @post campaignObject The user data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  updateCampaign(id: string, userId: string, campaignData: FormData): Observable<any> {
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
    console.log('userid ',userId)
    console.log('campaignData ',campaignData)
    return this.apiService.put<any>(`campaign/edit/${id}/${userId}`, campaignData, undefined, true);
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
  /* getCampaignsByStatus(status: string): Observable<any> {
    return this.apiService.get<any>(`campaign/?status=${status}`, undefined, undefined, true);
  } */

 /*  // Promoter accept a campaign
  acceptCampaign(campaignId: string, userId: string): Observable<any> {
    return this.apiService.post<any>(`campaign/${campaignId}/accept`, { userId }, undefined, true);
  } */

  // 
  getUserPromotions(userId: string): Observable<any> {
    return this.apiService.get<any>(`campaign/promotions/user/${userId}`, undefined, undefined, true);
  }

  // submit promotion proofs
  submitProof(formData: FormData): Observable<any> {
    return this.apiService.post<any>(`campaign/promotions/submit-proof`, formData, undefined, true);
  }

  // get submitted proofs
 /*  getProofDetails(promotionId: string): Observable<any> {
    return this.apiService.get<any>(`campaign/promotions/proof/${promotionId}`, undefined, undefined, true);
  } */




  validatePromotion(id: string): Observable<PromotionInterface> {
    return this.apiService.patch<PromotionInterface>(`${this.apiUrl}/${id}/validate`, {});
  }

  rejectPromotion(id: string, reason: string): Observable<PromotionInterface> {
    return this.apiService.patch<PromotionInterface>(`${this.apiUrl}/${id}/reject`, { reason });
  }



  getCampaignById(id: string): Observable<any> {
    return this.apiService.get<CampaignInterface>(`${this.apiUrl}/${id}`);
  }

  updateCampaignStatus(id: string, status: string): Observable<CampaignInterface> {
    return this.apiService.patch<CampaignInterface>(`${this.apiUrl}/${id}/status`, { status });
  }

  deleteCampaign(id: string): Observable<any> {
    return this.apiService.delete(`${this.apiUrl}/${id}`);
  }

  duplicateCampaign(id: string): Observable<CampaignInterface> {
    return this.apiService.post<CampaignInterface>(`${this.apiUrl}/${id}/duplicate`, {});
  }

}
