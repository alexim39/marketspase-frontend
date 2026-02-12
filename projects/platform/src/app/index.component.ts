import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit, } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from './auth/auth.service';
import { UserCredential } from '@angular/fire/auth'; // Import UserCredential for type safety
import { AuthError } from 'firebase/auth'; // Import AuthError for better error typing
import { UserService } from './common/services/user.service';
import { Platform } from '@angular/cdk/platform';

export interface SocialProvider {
  name: string;
  icon: string;
  color: string;
  backgroundColor: string;
  hoverColor: string;
  method: () => void;
}

@Component({
  selector: 'app-index',
  providers: [],
  imports: [
    MatButtonModule,
    RouterModule,
    CommonModule,
    MatIconModule,
    MatRippleModule,
    CommonModule
  ],
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
})
export class IndexComponent implements OnDestroy, OnInit {
  isLoading: boolean = false;
  currentProvider: string = '';
  currentYear: number = new Date().getFullYear();

  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private authService: AuthService = inject(AuthService);
  private userService: UserService = inject(UserService);

  private destroy$ = new Subject<void>();

  referralCode: string | null = null;

  userDevice: string = '';

  socialProviders: SocialProvider[] = [
    {
      name: 'Google',
      icon: 'account_circle',
      color: '#FBBC04',
      backgroundColor: '#f8f9ff',
      hoverColor: '#4285F4',
      method: () => this.signInWithGoogle(),
    },
    {
      name: 'Twitter (X)',
      icon: 'alternate_email',
      color: '#1da1f2',
      backgroundColor: '#f0f9ff',
      hoverColor: '#1a91da',
      method: () => this.signInWithTwitter(),
    },
    // {
    //   name: 'Facebook',
    //   icon: 'facebook',
    //   color: '#1877f2',
    //   backgroundColor: '#f0f2ff',
    //   hoverColor: '#166fe5',
    //   method: () => this.signInWithFacebook(),
    // },
    // {
    //   name: 'Apple',
    //   icon: 'phone_iphone',
    //   color: '#000000',
    //   backgroundColor: '#f5f5f5',
    //   hoverColor: '#333333',
    //   method: () => this.signInWithApple(),
    // },
   
  ];

  constructor(
    private router: Router,
    private platform: Platform
  ) {
    if (this.platform.ANDROID || this.platform.IOS) {
      //console.log('User is using a mobile device.');
      this.userDevice = 'mobile'
    } else {
      //console.log('User is using a desktop device.');
      this.userDevice = 'desktop'
    }
  }

  ngOnInit(): void {
    // Check for referral code from various sources
    this.getReferralCode();
  }

  private getReferralCode(): void {
    // Check URL parameters first (if someone shares with query params)
    const urlParams = new URLSearchParams(window.location.search);
    const urlReferral = urlParams.get('ref');
    
    // Check localStorage
    const localReferral = localStorage.getItem('referralCode');
    
    // Check cookies
    const cookieReferral = this.getCookie('referralCode');
    
    // Priority: URL params > localStorage > cookies
    this.referralCode = urlReferral || localReferral || cookieReferral;
    
    if (this.referralCode) {
      console.log('Referral code detected:', this.referralCode);
    }
  }

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  private setLoadingState(provider: string, loading: boolean): void {
    this.isLoading = loading;
    this.currentProvider = provider;
    this.cdr.detectChanges(); // Ensures UI updates when state changes
  }

  private clearReferralData(): void {
    localStorage.removeItem('referralCode');
    document.cookie = 'referralCode=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    this.referralCode = null;
  }

  signInWithGoogle(): void {
    this.setLoadingState('Google', true);

      this.authService.signInWithGoogle()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userCredential: UserCredential) => {
          //console.log('Authenticated Firebase User:', userCredential.user);
          this.handleAuthSuccess({ success: true, user: userCredential.user });
        },
        error: (error: AuthError | HttpErrorResponse) => { // Updated error type to include AuthError
          this.handleAuthError(error, 'Google');
        }
      })
  }

  signInWithFacebook(): void {
    this.setLoadingState('Facebook', true);

      this.authService.signInWithFacebook()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userCredential: UserCredential) => {
          //console.log('Authenticated Firebase User:', userCredential.user);
          this.handleAuthSuccess({ success: true, user: userCredential.user });
        },
        error: (error: AuthError | HttpErrorResponse) => { // Updated error type to include AuthError
          this.handleAuthError(error, 'Facebook');
        }
      })
  }

  signInWithApple(): void {
    this.setLoadingState('Apple', true);
    // Placeholder for Apple Sign-in. Uncomment and implement when ready.
    this.snackBar.open('Apple Sign-in is not yet implemented.', 'Got it', { duration: 3000 });
    this.setLoadingState('', false); // Reset loading for not-implemented feature
  }

  // --- NEW: Twitter Login Implementation ---
  signInWithTwitter(): void {
    this.setLoadingState('Twitter', true);
    
      this.authService.signInWithTwitter()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userCredential: UserCredential) => {
          //console.log('Authenticated Firebase User:', userCredential.user);
          this.handleAuthSuccess({ success: true, user: userCredential.user });
        },
        error: (error: AuthError | HttpErrorResponse) => { // Best to type Firebase Auth errors as AuthError
          this.handleAuthError(error, 'Twitter');
        }
      })
  }
  // --- END NEW ---

  private handleAuthSuccess(response: any): void {
    this.setLoadingState('Verifying', true); // This sets loading for backend verification
    if (response.success) {    
      const signupData = {
        ...response.user,
        referralCode: this.referralCode, // Include referral code in signup data
        userDevice: this.userDevice,
      }; 
        this.userService.auth(signupData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              // Clear referral data after successful registration
              this.clearReferralData();

              //console.log('response ',response)
              // Navigate to dashboard
              this.router.navigateByUrl('/dashboard');
            } else {
              this.router.navigateByUrl('/');
            }
            this.setLoadingState('', false); // Hide loader after backend auth completes
          },
          error: (error: HttpErrorResponse) => {
            this.snackBar.open('Local profile verification failed', 'Ok',{duration: 5000});
            this.setLoadingState('', false); // Hide loader on error
            this.cdr.markForCheck(); 
          }
        })      
    } else {
      this.setLoadingState('', false); // Hide loader if no success
    }
  }

  private handleAuthError(error: AuthError | HttpErrorResponse | any, provider: string): void {
    let errorMessage = `Failed to sign in with ${provider}. Please try again.`;
    
    if ((error as AuthError).code) { // Check if it's a Firebase AuthError
      errorMessage = `Authentication failed: ${ (error as AuthError).message }`;
      // You might want to map specific Firebase Auth error codes to user-friendly messages here
      // For example:
      if ((error as AuthError).code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in window was closed. Please try again.';
      }
    } else if (error instanceof HttpErrorResponse) { // Existing HTTP error handling
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
    } else if (error && error.message) { // Generic error with a message property
      errorMessage = error.message;
    }

    this.snackBar.open(errorMessage, 'Ok',{duration: 5000}); // Increased duration for error messages
    this.setLoadingState('', false);
    this.cdr.markForCheck(); // Mark for change detection to ensure error message is shown
  }

  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
