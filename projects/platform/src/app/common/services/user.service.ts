import { inject, Injectable, Signal, signal } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs'; // Import BehaviorSubject and of for reactive state
import { ApiService } from '../../../../../shared-services/src/public-api';
import { UserInterface } from '../../../../../shared-services/src/public-api';


@Injectable({ providedIn: 'root' })
export class UserService {
  private apiService: ApiService = inject(ApiService);
  
  // REPLACED: BehaviorSubject is replaced with a private signal for the user data.
  private _user = signal<UserInterface | null>(null);

  // EXPOSED: The signal is exposed as a public, readonly signal.
  public readonly user: Signal<UserInterface | null> = this._user;

  /**
   * Submits the user signin data to the backend API.
   * @param firebaseUser The signin data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  auth(firebaseUser: UserInterface): Observable<any> {
    //console.log('check for referral record ',firebaseUser)
    return this.apiService.post<any>(`auth`, {firebaseUser}, undefined, true);
  }

  /**
   * Get user data from the backend API.
   * @returns An Observable that emits the API response or an error.
   */
  getUser(uid: string): Observable<any> {
    return this.apiService.get<any>(`auth/${uid}`, undefined, undefined, true)
    .pipe(
      tap(response => {
        if (response.success) {
          //console.log('Updated user:', response);
          this._user.set(response.data as UserInterface);
        }
      }),
      catchError(error => {
        console.error('Error fetching user:', error);
        // Optionally clear user on error
        this._user.set(null);
        return throwError(() => error);
      })
    );
  }
  

  /**
   * Clears the current user.
   * This method can be used on logout.
   */
  clearUser() {
    this._user.set(null);
  }
}
