import { Injectable, OnDestroy, signal } from '@angular/core';
import { ApiService } from '../../../../../shared-services/src/public-api';
import { catchError, of, Subscription, tap } from 'rxjs';

export interface AdminInterface {
  _id: string;
  status: boolean;
  name: string;
  email: string;
  password?: string;
  role?: string;
  profileImage?: string;
  createdAt?: Date;
  notification: boolean;
  darkMode: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService implements OnDestroy {
  constructor(private apiService: ApiService) {}
  private subscriptions: Subscription[] = [];

  // The single source of truth for the admin data
  private readonly adminSignal = signal<AdminInterface | null>(null);

  // A public, readonly signal for components to consume
  readonly adminData = this.adminSignal.asReadonly();

  // A method to trigger the API call and update the signal
  fetchAdmin() {
    this.subscriptions.push(
      this.apiService.get<any>(`admin`, undefined, undefined, true).pipe(
        // Use the tap operator to perform a side effect (updating the signal)
        // without modifying the stream.
        tap(response => {
          if (response.success) {
            //console.log('Admin data fetched:', response.user);
            
            // Update the signal with the user data from the API
            this.adminSignal.set(response.user);
          }
        }),
        // Use catchError to handle errors gracefully and prevent the observable from dying.
        catchError(error => {
          console.error('Error fetching admin:', error);
          // You can clear the signal on error if you like
          this.adminSignal.set(null);
          // Return an observable with a safe value
          return of(null);
        })
      ).subscribe() // The subscribe is necessary to trigger the API call.
    );
  }


  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}