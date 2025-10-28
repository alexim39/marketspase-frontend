import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../shared-services/src/public-api';

export interface PromotionResponse {
  success: boolean;
  data: any[];
  message?: string;
}

@Injectable()
export class PromotionService {
  private apiService: ApiService = inject(ApiService);
  public api = this.apiService.getBaseUrl();
  private readonly apiUrl = 'promotion';

  getPromotions(): Observable<PromotionResponse> {
    return this.apiService.get<PromotionResponse>(`${this.apiUrl}/admin/promotions`);
  }

  validatePromotion(promotionId: string): Observable<PromotionResponse> {
    return this.apiService.post<PromotionResponse>(`${this.apiUrl}/admin/promotions/${promotionId}/validate`, {});
  }

  rejectPromotion(promotionId: string, reason: string): Observable<PromotionResponse> {
    return this.apiService.post<PromotionResponse>(`${this.apiUrl}/admin/promotions/${promotionId}/reject`, { reason });
  }

  markAsPaid(promotionId: string): Observable<PromotionResponse> {
    return this.apiService.post<PromotionResponse>(`${this.apiUrl}/admin/promotions/${promotionId}/mark-paid`, {});
  }

  revertToSubmitted(promotionId: string): Observable<PromotionResponse> {
    return this.apiService.post<PromotionResponse>(`${this.apiUrl}/admin/promotions/${promotionId}/revert`, {});
  }
}