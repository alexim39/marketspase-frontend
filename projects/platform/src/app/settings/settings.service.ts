import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../common/services/api.service';

export interface PersonalInfoInterface {
  id: string;
  name: string;
  lastname: string;
  address: string;
  email: string;
  phone: string;
  dob: Date;
  bio: string;
}
  
export interface ProfessionalInfoInterface {
  id: string;
  jobTitle: string;
  educationBackground: string;
  hobby: string;
  skill: string;
}

@Injectable()
export class SettingsService {
  constructor(private apiService: ApiService) {}


   /**
 * Submits the profile form data to the backend.
 * @param dataObject The  form data.
 * @returns An observable of the submitted form data.
 */
  updateProfile(dataObject: PersonalInfoInterface): Observable<any> {
    return this.apiService.put<any>(`user/profile/personal`, dataObject);
  }

  /**
 * Submits the profession form data to the backend.
 * @param dataObject The  form data.
 * @returns An observable of the submitted form data.
 */
  updateProfession(dataObject: ProfessionalInfoInterface): Observable<any> {
    return this.apiService.put<any>(`user/profile/profession`, dataObject);
  }

    /**
 * Submits the username form data to the backend.
 * @param dataObject The  form data.
 * @returns An observable of the submitted form data.
 */
  updateUsername(dataObject: any): Observable<any> {
    return this.apiService.put<any>(`user/profile/username`, dataObject);
  }

 /**
 * Submits the password form data to the backend.
 * @param dataObject The  form data.
 * @returns An observable of the submitted form data.
 */
  changePassword(dataObject: any): Observable<any> {
    return this.apiService.put<any>(`auth/change-password`, dataObject);
  }


  /**
   * Submits the account activation form data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
  activateAccount(formObject: {state: boolean, partnerId: string}): Observable<any> {
    return this.apiService.post<any>('partners/activate', formObject);
  }

   
}