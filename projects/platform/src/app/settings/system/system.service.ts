import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../shared-services/src/public-api';

export interface NotificationInterface {
  state: boolean; userId: string | undefined; 
}


@Injectable()
export class SettingsService {
  apiUrl = 'settings';
  constructor(private apiService: ApiService) {}
  

  /**
   * Submits the notification form data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
  toggleNotification(formObject: any): Observable<any> {
    return this.apiService.post<any>(`${this.apiUrl}/notification`, formObject);
  }

  /**
   * Submits the notification form data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
  submitAdsPreferences(formObject: { userId: string; preferences: any }): Observable<any> {
    return this.apiService.put<any>(`${this.apiUrl}/preferences/ads`, formObject);
  }

 
    
}