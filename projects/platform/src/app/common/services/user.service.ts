import { inject, Injectable, Signal, signal } from '@angular/core';
import { Observable } from 'rxjs'; // Import BehaviorSubject and of for reactive state
import { ApiService } from './api.service';
import { Campaign } from '../models/campaigns';

// Your UserInterface definition
export interface UserInterface {
  _id: string;
  status: boolean;
  displayName: string;
  email: string;
  username: string;
  biography?: string;
  role?: string;
  avatar?: string;
  createdAt?: Date;
  preferences?: {
    notification?: boolean;
  };
  darkMode?: boolean;
  testimonial?: {
    message?: string;
  };
  dob?: Date;
  isActive?: boolean;
  verified?: boolean;
  rating: number;
  personalInfo: {
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
    }
    email: string;
    phone: string;
    dob: Date;
    biography: string;
  };
  professionalInfo?: {
    skills?: string[];
    jobTitle: string;
    experience: {
      company: string;
      startDate: Date;
      endDate: Date;
      description: string;
      current: boolean;
    };
    education?: {
      institution: string;
      certificate: string;
      fieldOfStudy: string;
      startDate: Date;
      endDate: Date;
      description: string;
    };
  };
  interests?: {
    hobbies?: string[];
    favoriteTopics?: string[];
  };
  savedAccounts?: {
    _id: string;
    bank: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  }[];
  wallets?: {
    advertiser: {
      balance: number;
      reserved: number;
      transactions: {
        amount: number;
        category: string;
        createdAt: Date;
        description: string;
        status: string;
        type: string;
      };
    };
    promoter: {
      balance: number;
      reserved: number;
      transactions: {
        amount: number;
        category: string;
        createdAt: Date;
        description: string;
        status: string;
        type: string;
      };
    };
   
  };
  campaigns?: [Campaign]; // Adjust the type as per your Campaign model
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiService: ApiService = inject(ApiService);
  
  // REPLACED: BehaviorSubject is replaced with a private signal for the user data.
  private _user = signal<UserInterface | null>(null);

  // EXPOSED: The signal is exposed as a public, readonly signal.
  public readonly user: Signal<UserInterface | null> = this._user;

  /**
   * Submits the partner signin data to the backend API.
   * @param firebaseUser The signin data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  auth(firebaseUser: UserInterface): Observable<any> {
    return this.apiService.post<any>(`auth`, {firebaseUser}, undefined, true);
  }

  /**
   * Get user data from the backend API.
   * @returns An Observable that emits the API response or an error.
   */
  getUser(uid: string): Observable<any> {
    return this.apiService.get<any>(`auth/${uid}`, undefined, undefined, true);
  }

  /**
   * Sets the current user data in the signal.
   * This is the new way to update the user state.
   * @param data The user data to set.
   */
  setCurrentUser(data: UserInterface | null) { 
    this._user.set(data); 
  }

  /**
   * Clears the current user.
   * This method can be used on logout.
   */
  clearUser() {
    this._user.set(null);
  }
}
