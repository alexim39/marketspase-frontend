import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../shared-services/src/public-api';

export interface NotificationInterface {
  state: boolean; userId: string | undefined; 
}


@Injectable()
export class SettingsService {
  constructor(private apiService: ApiService) {}
  

  /**
   * Submits the notification form data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
  toggleNotification(formObject: any): Observable<any> {
    return this.apiService.post<any>('settings/notification', formObject);
  }

 
    
}