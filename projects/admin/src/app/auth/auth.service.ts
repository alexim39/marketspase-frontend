import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './../../../../shared-services/src/public-api';

export interface SignInInterface {
  email: string;
  password: string;
  rememberMe: boolean;
}


@Injectable()
export class AuthService {
 constructor(private apiService: ApiService) {}



  /**
   * Submits the partner signin data to the backend API.
   * @param formObject The signin data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  signIn(formObject: SignInInterface): Observable<any> {
    return this.apiService.post<SignInInterface>(`admin/signin`, formObject, undefined, true);
  }

  /**
   * Submits the partner sign out data to the backend API.
   * @param formObject The sign out data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  signOut(formObject: {}): Observable<any> {
    return this.apiService.post<any>('admin/signout', formObject, undefined, true);
  }

  
}