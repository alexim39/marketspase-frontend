import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../common/services/api.service';

export interface NotificationInterface {
  state: boolean; userId: string; 
}
export interface IncomeTargetInterface {
  partnerId: string;
  targetAmount: number;
  period: string;
}


@Injectable()
export class SettingsService {
  constructor(private apiService: ApiService) {}
  

  /**
   * Submits the notification form data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
  toggleNotification(formObject: NotificationInterface): Observable<any> {
    return this.apiService.post<any>('settings/notification', formObject);
  }

  /**
   * Submits the theme form data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
  toggleTheme(formObject: NotificationInterface): Observable<any> {
    return this.apiService.post<any>('settings/theme', formObject);
  }
    
  /**
   * Get the theme data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
  getThemeSetting(userId: string): Observable<any> {
    return this.apiService.get<any>(`settings/theme/${userId}`);
  }


    
}