import { inject, Injectable } from '@angular/core';
import { Observable, } from 'rxjs'; // Import BehaviorSubject and of for reactive state
import { ApiService } from '../../../../shared-services/src/public-api';
import { HttpParams } from '@angular/common/http';

// interfaces/statistics.interface.ts or add to existing interfaces
export interface RoleStatistics {
  role: string;
  counts: {
    total: number;
    active: number;
    inactive: number;
    verified: number;
    unverified: number;
    deleted: number;
    recent: number;
  };
  financial: {
    totalBalance: number;
    averageBalance: number;
    currency: string;
  };
  engagement: {
    averageRating: number;
    totalRatings: number;
    percentageRated: number;
  };
  activity: {
    totalReferrals: number;
    totalEarned: number;
  };
}

export interface StatisticsResponse {
  success: boolean;
  data: RoleStatistics;
}

@Injectable()
export class UserService {
  private apiService: ApiService = inject(ApiService);
  public api = this.apiService.getBaseUrl();
   private readonly apiUrl = 'user';
  

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
  getAppUsers(): Observable<any> {
    return this.apiService.get<any>(`user/admin/users`, undefined, undefined, true);
  }

  /**
   * Get users by role with pagination and filters
   */
  getUsersByRole(role: string, params?: any): Observable<any> {
    return this.apiService.get(`${this.apiUrl}/admin/users/${role}`, params);
  }

  /**
   * Get statistics for a specific role
   */
  getStatsByRole(role: string): Observable<any> {
    return this.apiService.get(`${this.apiUrl}/admin/users/${role}/stats`);
  }

  getUserById(id: string): Observable<any> {
    return this.apiService.get<any>(`user/admin/${id}`);
  }

  updateUserStatus(id: string, isActive: boolean): Observable<any> {
    return this.apiService.patch<any>(`user/admin/${id}/status`, { isActive });
  }

}