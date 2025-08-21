import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';
import { ApiService } from '../../common/services/api.service';


@Injectable()
export class AppReviewService {
  constructor(private apiService: ApiService) {}


   /**
   * Submits the form data to the backend.
   * @param formObject The form data.
   * @returns An observable of the submitted form data.
   */
  updateTestimonial(formObject: {message: string; userId: string}): Observable<any> {
    return this.apiService.put<any>(`user/testimonial`, formObject);
  }


  getTestimonial(userId: string | undefined): Observable<any> {
    return this.apiService.get<any>(`user/testimonial/getOne/${userId}`, undefined, undefined, true);
  }



   
}