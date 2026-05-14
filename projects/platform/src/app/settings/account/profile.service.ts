import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services';

@Injectable()
export class ProfileService {
  private readonly baseUserUrl = 'api/v1/user';

  constructor(private apiService: ApiService) {}

  updateProfile(userObject: unknown): Observable<any> {
    return this.apiService.put<any>(`${this.baseUserUrl}/profile/personal`, userObject, undefined, true);
  }

  updateProfession(dataObject: unknown): Observable<any> {
    return this.apiService.put<any>(`${this.baseUserUrl}/profile/profession`, dataObject, undefined, true);
  }

  updateUsername(dataObject: unknown): Observable<any> {
    return this.apiService.put<any>(`${this.baseUserUrl}/profile/username`, dataObject, undefined, true);
  }

  updatePublicIdentity(dataObject: unknown): Observable<any> {
    return this.apiService.put<any>(`${this.baseUserUrl}/profile/public-identity`, dataObject, undefined, true);
  }

  getReferralStats(userId: string): Observable<any> {
    return this.apiService.get<any>(`${this.baseUserUrl}/referral/stats/${userId}`, undefined, undefined, true);
  }

  getReferralDetails(userId: string, page = 1, limit = 20): Observable<any> {
    return this.apiService.get<any>(
      `${this.baseUserUrl}/referral/details/${userId}?page=${page}&limit=${limit}`,
      undefined,
      undefined,
      true,
    );
  }

  validateReferralCode(referralCode: string): Observable<any> {
    return this.apiService.get<any>(`${this.baseUserUrl}/referral/validate/${referralCode}`);
  }

  copyReferralLink(link: string): Promise<void> {
    return navigator.clipboard.writeText(link);
  }
}
