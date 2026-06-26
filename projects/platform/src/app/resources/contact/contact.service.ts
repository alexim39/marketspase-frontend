import { Injectable } from '@angular/core';
import { Observable, } from 'rxjs';
import { ApiService } from '@shared/services/api';

export interface ContactFormData {
  fullName: string;
  email: string;
  company: string;
  phone: string;
  inquiryType: string;
  message: string;
  newsletter: boolean;
  terms: boolean;
}

@Injectable()
export class ContactService {
   constructor(private apiService: ApiService) {}
   
  /**
   * Submits the contact form data to the backend.
   * @param formObject The contact form data.
   * @returns An observable of the submitted form data.
   */
  submit(payload: ContactFormData): Observable<ContactFormData> {
    console.log('payload ',payload)
    return this.apiService.post<any>('api/v1/contact/external-contact', payload);
  }
}
