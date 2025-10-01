import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';
import { ApiService } from '../../../../../shared-services/src/public-api';


@Injectable()
export class SupportService {
  constructor(private apiService: ApiService) {}


   /**
   * Submits the form data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
  updateTestimonial(formObject: {message: string; userId: string | undefined}): Observable<any> {
    return this.apiService.put<any>(`settings/testimonial`, formObject, undefined, true);
  }

   /**
   * Get data from the backend.
   * @returns An observable of the submitted form data.
   */
  getTestimonial(userId: string): Observable<any> {
    return this.apiService.get<any>(`settings/testimonial/${userId}`, undefined, undefined, true);
  }

    /**
   * Submits the contact form data to the backend.
   * @param formObject The contact form data.
   * @returns An observable of the submitted form data.
   */
  submit(formObject: any): Observable<any> {
    return this.apiService.post<any>('contact/submit', formObject, undefined, true);
  }



   
}