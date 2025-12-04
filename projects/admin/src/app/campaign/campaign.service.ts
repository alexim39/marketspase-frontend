import { inject, Injectable } from '@angular/core';
import { Observable, } from 'rxjs'; // Import BehaviorSubject and of for reactive state
import { ApiService } from '../../../../shared-services/src/public-api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable()
export class CampaignService {
  private apiService: ApiService = inject(ApiService);
  public api = this.apiService.getBaseUrl();
  private readonly apiBase = 'campaign/admin'
  private readonly apiBase2 = 'campaign'
  

  /**
   * Submits the user data to the backend API.
   * @post campaignObject The user data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
//   create(campaignData: FormData): Observable<any> {
//     return this.apiService.post<any>(`campaign/create`, campaignData, undefined, true);
//   }


  /**
   * Get the form data to the backend.
   * @returns An observable of the submitted form data.
  */
  getAppCampaigns(): Observable<any> {
    return this.apiService.get<any>(`${this.apiBase}/campaigns`, undefined, undefined, true);
  }

  getCampaignById(id: string): Observable<ApiResponse<any>> {
    return this.apiService.get<ApiResponse<any>>(`${this.apiBase2}/${id}`, undefined, undefined, true);
  }

  updateCampaignStatus(id: string, status: string, createdBy: string): Observable<ApiResponse<any>> {
    return this.apiService.patch<ApiResponse<any>>(`${this.apiBase}/${id}/status`, { status, createdBy }, undefined, true);
  }

  updatePromotionStatus(id: string, status: string, performedBy: string, rejectionReason: string = ''): Observable<ApiResponse<any>> {
    return this.apiService.patch<ApiResponse<any>>(`${this.apiBase}/promotion/${id}/status/${performedBy}`, { status, rejectionReason });
  }

}