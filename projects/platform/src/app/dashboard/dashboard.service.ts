import { inject, Injectable } from '@angular/core';
import { Observable, } from 'rxjs'; // Import BehaviorSubject and of for reactive state
import { ApiService } from '../common/services/api.service';



@Injectable()
export class DashboardService {
  private apiService: ApiService = inject(ApiService);
  

  /**
   * Submits the user data to the backend API.
   * @post roleObject The user data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  switchUser(roleObject: {role: string, userId: string | undefined}): Observable<any> {
    return this.apiService.post<any>(`user/switch-user`, roleObject, undefined, true);
  }

}
