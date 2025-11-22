import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../auth/auth.service';
import { ProfileService } from '../settings/account/profile.service';
import { catchError, map, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'async-referral-capture',
  standalone: true,
  providers: [ProfileService],
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="referral-container">
      <mat-card class="referral-card">
        <mat-card-content class="referral-content">
          @if (isLoading()) {
            <div class="loading-section">
              <mat-spinner diameter="40"/>
              <p>Processing referral...</p>
            </div>
          }

          @if (!isLoading() && isSuccess()) {
            <div class="success-section">
              <div class="success-icon">
                <mat-icon>check_circle</mat-icon>
              </div>
              <h2>Referral Applied Successfully!</h2>
              <p>You've been referred by <strong>{{ referrerName() }}</strong></p>
              <p class="bonus-info">You'll both earn bonuses when you complete your first activity!</p>
              <button mat-flat-button color="primary" (click)="navigateToHome()">
                Continue to Sign Up
              </button>
            </div>
          }

          @if (!isLoading() && !isSuccess() && errorMessage()) {
            <div class="error-section">
              <div class="error-icon">
                <mat-icon>error</mat-icon>
              </div>
              <h2>Invalid Referral Link</h2>
              <p><strong>Something is wrong here: {{ errorMessage() }}</strong></p>
              <p class="bonus-info">It appears this link is invalid or does not exist</p>
              <div class="action-buttons">
                <button mat-flat-button color="primary" (click)="navigateToHome()">
                  Go to Homepage
                </button>
              </div>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .referral-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .referral-card {
      max-width: 400px;
      width: 100%;
      text-align: center;
      padding: 40px 20px;
    }

    .referral-content {
      padding: 20px 0;
    }

    .loading-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;

      p {
        margin: 0;
        color: #666;
      }
    }

    .success-section, .error-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .success-icon, .error-icon {
      mat-icon {
        font-size: 5em;
        height: 84px;
        width: 84px
      }
    }

    .success-icon {
      color: #4caf50;
    }

    .error-icon {
      color: #f44336;
    }

    h2 {
      margin: 0;
      color: #333;
    }

    p {
      margin: 0;
      color: #666;
      text-align: center;
    }

    .bonus-info {
      font-size: 14px;
      font-style: italic;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      max-width: 200px;
    }

    button {
      width: 100%;
    }
  `]
})
export class ReferralCaptureComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private redirectDelay = 5000;

  // Use signals for state management
  isLoading = signal(true);
  isSuccess = signal(false);
  referrerName = signal('');
  errorMessage = signal('');

  ngOnInit(): void {
    this.captureReferral();
  }

  private captureReferral(): void {
    const username = this.route.snapshot.paramMap.get('username');
    
    if (!username) {
      this.handleError('Invalid referral link');
      return;
    }

    // Use reactive approach with signals
    // this.profileService.validateReferralCode(username)
    //   .pipe(
    //     tap(response => console.log('Backend response:', response)),
    //     catchError(error => {
    //       console.error('Referral validation error:', error);
    //       this.handleError('Failed to validate referral link. Please try again.');
    //       return of({ success: false, message: 'Validation failed' });
    //     })
    //   )
    //   .subscribe({
    //     next: (response) => {
    //       if (response.success) {
    //         this.handleSuccess(response.data.referrerName, username);
    //       } else {
    //         this.handleError(response.message || 'Invalid referral code');
    //       }
    //     }
    //   });

    // Use reactive approach with signals
    this.profileService.validateReferralCode(username)
      .pipe(
        tap(response => console.log('Backend response:', response)),
        catchError(error => {
          console.error('Referral validation error:', error);
          this.handleError('Failed to validate referral link. Please try again.');
          
          // Redirect to home page after error message is displayed (8 seconds)
          setTimeout(() => {
            this.router.navigate(['/']); // or your home route
          }, this.redirectDelay);
          
          return of({ success: false, message: 'Validation failed' });
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.handleSuccess(response.data.referrerName, username);
            
            // Redirect to home page after success message is displayed (8 seconds)
            setTimeout(() => {
              this.router.navigate(['/']); // or your home route
            }, this.redirectDelay);
            
          } else {
            this.handleError(response.message || 'Invalid referral code');
            
            // Redirect to home page after error message is displayed (8 seconds)
            setTimeout(() => {
              this.router.navigate(['/']); // or your home route
            }, this.redirectDelay);
          }
        }
      });
  }

  private handleSuccess(referrerName: string, username: string): void {
    this.isSuccess.set(true);
    this.referrerName.set(referrerName);
    this.storeReferralCode(username);
    this.isLoading.set(false);
    console.log('Referral successfully processed');
  }

  private handleError(message: string): void {
    this.isSuccess.set(false);
    this.errorMessage.set(message);
    this.isLoading.set(false);
    
    // Clear any existing referral codes
    this.clearReferralData();
  }

  private storeReferralCode(username: string): void {
    // Store in localStorage to use during registration
    localStorage.setItem('referralCode', username);
    
    // Also set a cookie that expires in 7 days for cross-session persistence
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    document.cookie = `referralCode=${username}; expires=${expires.toUTCString()}; path=/; samesite=lax`;
  }

  private clearReferralData(): void {
    localStorage.removeItem('referralCode');
    document.cookie = 'referralCode=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }
}