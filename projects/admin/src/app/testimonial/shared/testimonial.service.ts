import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Testimonial } from './testimonial.model';
import { ApiService } from '../../../../../shared-services/src/public-api';

@Injectable({
  providedIn: 'root'
})
export class TestimonialService {
  private apiService: ApiService = inject(ApiService);
  public api = this.apiService.getBaseUrl();

  private apiUrl = 'settings/testimonial/admin';


  getTestimonials(): Observable<any> {
    return this.apiService.get<Testimonial[]>(this.apiUrl);
  }

  getTestimonialById(id: string): Observable<Testimonial> {
    return this.apiService.get<Testimonial>(`${this.apiUrl}/${id}`);
  }

  updateTestimonialStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Observable<Testimonial> {
    return this.apiService.patch<Testimonial>(`${this.apiUrl}/${id}/status`, { status });
  }

  toggleFeatured(id: string, isFeatured: boolean): Observable<Testimonial> {
    return this.apiService.patch<Testimonial>(`${this.apiUrl}/${id}/featured`, { isFeatured });
  }

  deleteTestimonial(id: string): Observable<any> {
    return this.apiService.delete(`${this.apiUrl}/${id}`);
  }
}