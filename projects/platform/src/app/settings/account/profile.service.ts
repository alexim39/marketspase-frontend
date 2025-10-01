import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../shared-services/src/public-api';

@Injectable()
export class ProfileService {
  constructor(private apiService: ApiService) {}


   /**
 * Submits the profile form data to the backend.
 * @param dataObject The  form data.
 * @returns An observable of the submitted form data.
 */
  updateProfile(userObject: any): Observable<any> {
    return this.apiService.put<any>(`user/profile/personal`, userObject, undefined, true);
  }

  /**
 * Submits the profession form data to the backend.
 * @param dataObject The  form data.
 * @returns An observable of the submitted form data.
 */
  updateProfession(dataObject: any): Observable<any> {
    return this.apiService.put<any>(`user/profile/profession`, dataObject, undefined, true);
  }

    /**
 * Submits the username form data to the backend.
 * @param dataObject The  form data.
 * @returns An observable of the submitted form data.
 */
  updateUsername(dataObject: any): Observable<any> {
    return this.apiService.put<any>(`user/profile/username`, dataObject, undefined, true);
  }
   
}