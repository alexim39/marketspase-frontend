import { inject, Injectable, Signal, signal } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs'; // Import BehaviorSubject and of for reactive state
import { ApiService } from '@shared/services/api';
import { UserInterface } from '@shared/services';


@Injectable({ providedIn: 'root' })
export class UserService {
  private apiService: ApiService = inject(ApiService);
  private readonly userStorageKey = 'marketspase.currentUser';
  
  // REPLACED: BehaviorSubject is replaced with a private signal for the user data.
  private _user = signal<UserInterface | null>(null);

  // EXPOSED: The signal is exposed as a public, readonly signal.
  public readonly user: Signal<UserInterface | null> = this._user;

  constructor() {
    const storedUser = this.getStoredUser();
    if (storedUser) {
      this._user.set(storedUser);
    }
  }

  /**
   * Submits the user signin data to the backend API.
   * @param firebaseUser The signin data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  auth(firebaseUser: unknown, idToken: string): Observable<any> {
    //console.log('check for referral record ',firebaseUser)
    return this.apiService.post<any>(`api/v1/auth`, { firebaseUser, idToken }, undefined, true);
  }

  /**
   * Get user data from the backend API.
   * @returns An Observable that emits the API response or an error.
   */
  getUser(uid: string): Observable<any> {
    return this.apiService.get<any>(`api/v1/auth/${uid}`, undefined, undefined, true)
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

  getCurrentUser(): Observable<any> {
    return this.apiService.get<any>(`api/v1/auth/me`, undefined, undefined, true)
    .pipe(
      tap(response => {
        if (response.success) {
          this.setUser(response.data as UserInterface, true);
        }
      }),
      catchError(error => {
        console.error('Error fetching current user:', error);
        this.clearUser();
        return throwError(() => error);
      })
    );
  }

  setUser(user: UserInterface | null, persist = false): void {
    this._user.set(user);

    if (persist && user) {
      this.storeUser(user);
    }
  }
  

  /**
   * Clears the current user.
   * This method can be used on logout.
   */
  clearUser() {
    this._user.set(null);
    try {
      localStorage.removeItem(this.userStorageKey);
    } catch {
      // localStorage can be unavailable in restricted browser contexts.
    }
  }

  private storeUser(user: UserInterface): void {
    try {
      localStorage.setItem(this.userStorageKey, JSON.stringify(user));
    } catch {
      // Ignore storage failures; the in-memory signal still carries the user.
    }
  }

  private getStoredUser(): UserInterface | null {
    try {
      const rawUser = localStorage.getItem(this.userStorageKey);
      return rawUser ? JSON.parse(rawUser) as UserInterface : null;
    } catch {
      return null;
    }
  }
}
