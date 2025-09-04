import { inject, Injectable } from '@angular/core';
import { Observable, } from 'rxjs'; // Import BehaviorSubject and of for reactive state
import { ApiService } from '../../../../shared-services/src/public-api';


@Injectable()
export class UserService {
  private apiService: ApiService = inject(ApiService);
  public api = this.apiService.getBaseUrl();
  

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
    return this.apiService.get<any>(`user/users`, undefined, undefined, true);
  }

  getUserById(id: string): Observable<any> {
    return this.apiService.get<any>(`user/${id}`);
  }

  updateUserStatus(id: string, isActive: boolean): Observable<any> {
    return this.apiService.patch<any>(`user/${id}/status`, { isActive });
  }

}