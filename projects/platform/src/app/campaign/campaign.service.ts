import { inject, Injectable } from '@angular/core';
import { Observable, } from 'rxjs'; // Import BehaviorSubject and of for reactive state
import { ApiService } from '../common/services/api.service';

export interface CampaignData {
  title: string;
  caption: string;
  link?: string;
  category: string;
  budget: number;
  startDate: Date;
  endDate?: Date;
  hasEndDate: boolean;
  mediaUrl: string;
  currency: string;
  owner: string; // The user ID
}


@Injectable()
export class CampaingService {
  private apiService: ApiService = inject(ApiService);
  

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

}
