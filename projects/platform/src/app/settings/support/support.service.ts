import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';
import { ApiService } from '../../common/services/api.service';


@Injectable()
export class SupportService {
  constructor(private apiService: ApiService) {}


   /**
   * Submits the form data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
  updateTestimonial(formObject: {message: string; userId: string | undefined}): Observable<any> {
    return this.apiService.put<any>(`settings/testimonial`, formObject);
  }

   /**
   * Get data from the backend.
   * @returns An observable of the submitted form data.
   */
  getTestimonial(userId: string): Observable<any> {
    return this.apiService.get<any>(`settings/testimonial/${userId}`, undefined, undefined, true);
  }



   
}