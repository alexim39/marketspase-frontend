import { inject, Injectable } from '@angular/core';
import { Observable, } from 'rxjs'; // Import BehaviorSubject and of for reactive state
import { ApiService, CampaignInterface, PromotionInterface } from '../../../../../shared-services/src/public-api';


@Injectable()
export class CampaignEditService {
  private apiService: ApiService = inject(ApiService);
  public api = this.apiService.getBaseUrl();
  private apiUrl = 'campaign';


  /**
   * @get campaignObject The user data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  getCampaignById(id: string): Observable<any> {
    return this.apiService.get<CampaignInterface>(`${this.apiUrl}/${id}`);
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
    return this.apiService.put<any>(`${this.apiUrl}/edit/${id}/${userId}`, campaignData, undefined, true);
  }





}
