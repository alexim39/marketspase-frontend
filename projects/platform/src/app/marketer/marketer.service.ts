import { inject, Injectable } from '@angular/core';
import { Observable, } from 'rxjs'; // Import BehaviorSubject and of for reactive state
import { ApiService } from '../../../../shared-services/src/public-api';


@Injectable()
export class MarketerService {
  private readonly apiService: ApiService = inject(ApiService);
  public readonly api = this.apiService.getBaseUrl();
  private readonly apiUrl = 'campaign';


  /**
   * Get the form data to the backend.
   * @returns An observable of the submitted form data.
  */
  getMarketerCampaign(userId: string): Observable<any> {
    return this.apiService.get<any>(`${this.apiUrl}/user/${userId}`, undefined, undefined, true);
  }


}
