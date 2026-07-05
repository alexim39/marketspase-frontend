import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api';

@Injectable({ providedIn: 'root' })
export class EngagementService {
  private api = inject(ApiService);
  private base = 'api/v1/social';

  browsePromoters(): Observable<any> {
    return this.api.get<any>(`${this.base}/promoters`, undefined, undefined, true);
  }

  createContract(data: any): Observable<any> {
    return this.api.post<any>(`${this.base}/contracts`, data, undefined, true);
  }

  listContracts(role: 'marketer' | 'promoter'): Observable<any> {
    return this.api.get<any>(`${this.base}/contracts?role=${role}`, undefined, undefined, true);
  }

  getContract(id: string): Observable<any> {
    return this.api.get<any>(`${this.base}/contracts/${id}`, undefined, undefined, true);
  }

  respondToContract(id: string, action: 'accept' | 'decline'): Observable<any> {
    return this.api.post<any>(`${this.base}/contracts/${id}/respond`, { action }, undefined, true);
  }

  updateTaskProgress(id: string, taskIndex: number, completed: number): Observable<any> {
    return this.api.post<any>(`${this.base}/contracts/${id}/progress`, { taskIndex, completed }, undefined, true);
  }

  approveMilestone(id: string, milestoneIndex?: number): Observable<any> {
    return this.api.post<any>(`${this.base}/contracts/${id}/approve`, { milestoneIndex }, undefined, true);
  }

  rateContract(id: string, rating: number, review: string, role: 'marketer' | 'promoter'): Observable<any> {
    return this.api.post<any>(`${this.base}/contracts/${id}/rate`, { rating, review, role }, undefined, true);
  }

  disputeContract(id: string, reason: string): Observable<any> {
    return this.api.post<any>(`${this.base}/contracts/${id}/dispute`, { reason }, undefined, true);
  }
}
