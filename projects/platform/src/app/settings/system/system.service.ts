// system.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../shared-services/src/public-api';

export interface NotificationInterface {
  state: boolean; 
  userId: string | undefined;
}

export interface ThemeInterface {
  darkMode: boolean;
  highContrast: boolean;
  systemDefault: boolean;
  userId: string;
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
  toggleNotification(formObject: NotificationInterface): Observable<any> {
    return this.apiService.post<any>(`${this.apiUrl}/notification`, formObject);
  }

  /**
   * Submits the ads preferences form data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
  submitAdsPreferences(formObject: { userId: string; preferences: any }): Observable<any> {
    return this.apiService.put<any>(`${this.apiUrl}/preferences/ads`, formObject);
  }

  /**
   * Updates the user's theme preferences.
   * @param formObject The theme preferences data.
   * @returns An observable of the submitted form data.
   */
  updateTheme(formObject: ThemeInterface): Observable<any> {
    return this.apiService.put<any>(`${this.apiUrl}/preferences/theme`, {
      userId: formObject.userId,
      preferences: {
        theme: {
          darkMode: formObject.darkMode,
          highContrast: formObject.highContrast,
          systemDefault: formObject.systemDefault
        }
      }
    });
  }
}