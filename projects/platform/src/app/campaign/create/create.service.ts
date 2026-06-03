import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs'; 
import { ApiService } from '@shared/services';

export interface CampaignMediaAsset {
  mediaUrl: string;
  mediaType: string;
  thumbnailUrl: string;
  mediaPublicId?: string;
}

export interface CampaignMediaUploadResponse {
  success: boolean;
  message: string;
  data: CampaignMediaAsset;
}

export interface CampaignPpcPricingConfig {
  enabled: boolean;
  currency: string;
  defaultCostPerClick: number;
  minCostPerClick: number;
  maxCostPerClick: number;
  allowMarketerOverride: boolean;
  updatedAt?: string | Date | null;
}

export interface CampaignPpcPricingConfigResponse {
  success: boolean;
  message?: string;
  data: CampaignPpcPricingConfig;
}

@Injectable()
export class CampaignService {
  private apiService: ApiService = inject(ApiService);
  private http = inject(HttpClient);
  public readonly api = this.apiService.getBaseUrl();
  private readonly apiUrl = 'api/v1/campaign';

  private handleUploadError(error: HttpErrorResponse): Observable<never> {
    console.error('Campaign media upload failed:', error);
    return throwError(() => error);
  }
  

  /**
   * Submits the user campaign data to the backend API to create new campaign.
   * @post campaignObject The user data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  create(campaignData: Record<string, unknown>): Observable<any> {
    return this.apiService.post<any>(`${this.apiUrl}/create`, campaignData, undefined, true);
  }

  /**
   * Submits the user campaign data to be be saved to draft the backend API.
   * @post campaignObject The user data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  save(campaignData: Record<string, unknown>): Observable<any> {
    return this.apiService.post<any>(`${this.apiUrl}/save`, campaignData, undefined, true);
  }

  getPricingConfig(): Observable<CampaignPpcPricingConfigResponse> {
    return this.apiService.get<CampaignPpcPricingConfigResponse>(`${this.apiUrl}/pricing/config`, undefined, undefined, true);
  }

  uploadMedia(file: File): Observable<HttpEvent<CampaignMediaUploadResponse>> {
    const formData = new FormData();
    formData.append('media', file);

    return this.http.post<CampaignMediaUploadResponse>(
      `${this.api}/${this.apiUrl}/media/upload`,
      formData,
      {
        observe: 'events',
        reportProgress: true,
        withCredentials: true,
      }
    ).pipe(
      catchError((error: HttpErrorResponse) => this.handleUploadError(error))
    );
  }

}
