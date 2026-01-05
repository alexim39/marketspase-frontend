import { inject, Injectable } from '@angular/core';
import { Observable, } from 'rxjs'; // Import BehaviorSubject and of for reactive state
import { ApiService } from '../../../../../shared-services/src/public-api';


@Injectable()
export class CampaignService {
  private apiService: ApiService = inject(ApiService);
  public readonly api = this.apiService.getBaseUrl();
  private readonly apiUrl = 'campaign';
  

  /**
   * Submits the user campaign data to the backend API to create new campaign.
   * @post campaignObject The user data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  create(campaignData: FormData): Observable<any> {
    return this.apiService.post<any>(`${this.apiUrl}/create`, campaignData, undefined, true);
  }

  /**
   * Submits the user campaign data to be be saved to draft the backend API.
   * @post campaignObject The user data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  save(campaignData: FormData): Observable<any> {
    return this.apiService.post<any>(`${this.apiUrl}/save`, campaignData, undefined, true);
  }

}
