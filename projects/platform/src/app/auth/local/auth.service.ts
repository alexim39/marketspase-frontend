import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService, UserInterface } from '@shared/services';
import { UserService } from '../../common/services/user.service';

export interface SignInInterface {
  email: string;
  password: string;
}
export interface SignUpInterface {
  email: string;
  password: string;
  displayName?: string;
  name?: string;
  lastname?: string;
  referralCode?: string | null;
  userDevice?: string | null;
  verificationCode?: string | null;
}

export interface LocalAuthResponse {
  success: boolean;
  message: string;
  user?: UserInterface;
  token?: string;
  isNewUser?: boolean;
  requiresEmailVerification?: boolean;
  code?: string;
}

export interface LocalPasswordResetRequest {
  email: string;
}

export interface LocalPasswordResetConfirm {
  email: string;
  password: string;
  verificationCode: string;
  userDevice?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
 constructor(
  private apiService: ApiService,
  private userService: UserService,
 ) {}

  /**
   * Submits the user signin data to the backend API.
   * @param formObject The signin data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  signIn(formObject: SignInInterface): Observable<any> {
    return this.apiService.post<LocalAuthResponse>(`api/v1/auth/local/signin`, formObject, undefined, true);
  }

   /**
   * Submits the user signInWithGoogle data to the backend API.
   * @param formObject The signin data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  signInWithGoogle(googleUser: any): Observable<any> {
    return this.apiService.post<any>(`api/v1/auth`, googleUser, undefined, true);
  }

  /**
   * Submits the user sing up data to the backend API.
   * @param formObject The sing up data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  signUp(formObject: SignUpInterface): Observable<any> {
    const displayName = formObject.displayName || [formObject.name, formObject.lastname].filter(Boolean).join(' ').trim();
    return this.apiService.post<LocalAuthResponse>(
      `api/v1/auth/local/signup`,
      { ...formObject, displayName },
      undefined,
      true
    );
  }

  /**
   * Submits the user sign out data to the backend API.
   * @param formObject The sign out data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  signOut(formObject: {}): Observable<any> {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('isAuthenticated');
    this.userService.clearUser();
    return of({ success: true });
  }

  /**
   * Submits the user change password data to the backend API.
   * @param formObject The change password data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  requestPasswordChange(formObject: any): Observable<any> {
    return this.apiService.post<LocalAuthResponse>('api/v1/auth/local/request-password-reset', formObject, undefined, true);
  }

  /**
   * Submits the user reset password data to the backend API.
   * @param formObject The reset password data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  resetPassword(formObject: any): Observable<any> {
    return this.apiService.post<LocalAuthResponse>('api/v1/auth/local/reset-password', formObject, undefined, true);
  }

  persistLocalSession(response: LocalAuthResponse): void {
    if (!response?.token) {
      return;
    }

    localStorage.setItem('token', response.token);
    localStorage.setItem('accessToken', response.token);
    localStorage.setItem('isAuthenticated', 'true');

    if (response.user) {
      this.userService.setUser(response.user, true);
    }
  }
}
