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

  
  



  // Referral methods
  getReferralStats(userId: string): Observable<any> {
    //console.log('Fetching referral stats for userId:', userId);
    return this.apiService.get<any>(`user/referral/stats/${userId}`, undefined, undefined, true);
  }

  getReferralDetails(userId: string, page: number = 1, limit: number = 20): Observable<any> {
    //console.log('Fetching referral stats for userId:', userId);

    return this.apiService.get<any>(
      `user/referral/details/${userId}?page=${page}&limit=${limit}`, 
      undefined, 
      undefined, 
      true
    );
  }

  validateReferralCode(referralCode: string): Observable<any> {
    //console.log('Fetching referral stats for referralCode:', referralCode);

    return this.apiService.get<any>(`user/referral/validate/${referralCode}`);
  }

  copyReferralLink(link: string): Promise<void> {
    return navigator.clipboard.writeText(link);
  }
   
}