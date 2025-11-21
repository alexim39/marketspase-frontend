import { 
  Component, inject, Input, OnInit, signal, computed, DestroyRef, 
  Signal, OnDestroy, 
  effect
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserInterface } from '../../../../../../shared-services/src/public-api';
import { UsernameDialogComponent } from './help-dialog.component';
import { ProfileService } from '../profile.service';
import { UserService } from '../../../common/services/user.service';
import { RESTRICTEDWORDS } from './restricted-words';

@Component({
  selector: 'async-username-info',
  standalone: true,
  providers: [ProfileService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    <mat-card class="username-card">
      <mat-card-header>
        <mat-card-title class="username-title">
          <mat-icon class="username-icon">alternate_email</mat-icon>
          Customize Your Profile URL
        </mat-card-title>
        <mat-card-subtitle class="username-subtitle">
          Choose a unique username that will be part of your profile, store and referral link
        </mat-card-subtitle>
      </mat-card-header>

      <mat-divider></mat-divider>

      <mat-card-content>
        <form [formGroup]="usernameForm" class="username-form">
          <div class="form-section">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Username</mat-label>
              <input
                matInput
                formControlName="username"
                required
                placeholder="Enter your unique username"
              />
              <button
                mat-icon-button
                matSuffix
                (click)="showHelp()"
                matTooltip="Username guidelines"
                type="button"
              >
                <mat-icon>help_outline</mat-icon>
              </button>
              <mat-hint>3-30 characters, letters, numbers and underscores only</mat-hint>
              @if (usernameForm.get('username')?.hasError('required')) {
                <mat-error>Username is required</mat-error>
              }
              @if (usernameForm.get('username')?.hasError('pattern')) {
                <mat-error>Only letters, numbers and underscores allowed</mat-error>
              }
              @if (usernameForm.get('username')?.hasError('minlength')) {
                <mat-error>Minimum 3 characters required</mat-error>
              }
              @if (usernameForm.get('username')?.hasError('maxlength')) {
                <mat-error>Maximum 30 characters allowed</mat-error>
              }
              @if (usernameForm.get('username')?.hasError('restrictedWord')) {
                <mat-error>This username contains a restricted word.</mat-error>
              }
            </mat-form-field>

            <div class="url-preview">
              <div class="preview-label">
                <mat-icon>link</mat-icon>
                <span>Your store URL will be:</span>
              </div>
              <div class="preview-value">
                marketspase.com/{{ username() | lowercase }}
              </div>
            </div>
          </div>
        </form>

        <!-- Referral Section -->
        @if (referralStats() && usernameForm.get('username')?.valid) {
          <div class="referral-section">
            <div class="referral-info">
              <h4 class="referral-title">
                <mat-icon class="referral-icon">card_giftcard</mat-icon>
                Your Referral Program
              </h4>
              
              <div class="referral-stats">
                <div class="stat-item">
                  <span class="stat-label">Total Referrals:</span>
                  <span class="stat-value">{{ referralStats().totalReferrals }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Pending Referrals:</span>
                  <span class="stat-value">{{ referralStats().pendingReferrals }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Completed Referrals:</span>
                  <span class="stat-value">{{ referralStats().paidReferrals }}</span>
                </div>
                <div class="stat-item earnings">
                  <span class="stat-label">Total Earned:</span>
                  <span class="stat-value">₦{{ referralStats().totalEarned }}</span>
                </div>
                @if (referralStats().estimatedEarnings > 0) {
                  <div class="stat-item potential">
                    <span class="stat-label">Potential Earnings:</span>
                    <span class="stat-value">₦{{ referralStats().estimatedEarnings }}</span>
                  </div>
                }
              </div>

              <div class="referral-link-container">
                <label class="link-label">Your Referral Link:</label>
                <div class="referral-link">
                  <code class="link-code">{{ referralStats().referralLink }}</code>
                  <button 
                    mat-icon-button 
                    (click)="copyReferralLink()" 
                    matTooltip="Copy referral link"
                    class="copy-button"
                  >
                    <mat-icon>content_copy</mat-icon>
                  </button>
                </div>
              </div>

              <div class="referral-rules">
                <h5 class="rules-title">How it works:</h5>
                <ul class="rules-list">
                  <li>
                    <strong>Earn ₦1000</strong> when a <strong>marketer</strong> you refer makes their first payment
                  </li>
                  <li>
                    <strong>Earn ₦250</strong> when a <strong>promoter</strong> you refer completes their first paid promotion
                  </li>
                  <li>
                    <strong>One-time bonus:</strong> Each person can only generate one bonus for you, regardless of role changes
                  </li>
                  <li>
                    <strong>Instant payment:</strong> Bonuses are paid automatically to your wallet
                  </li>
                </ul>
              </div>
            </div>
          </div>
        }
      </mat-card-content>

      <mat-divider></mat-divider>

      <mat-card-actions class="form-actions">
        <button
          mat-flat-button
          color="primary"
          class="save-button"
          [disabled]="usernameForm.invalid || isLoading()"
          (click)="onSubmit()"
        >
          @if (!isLoading()) {
            <span>Save Changes</span>
          } @else {
            <mat-spinner diameter="20"></mat-spinner>
          }
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styleUrls: ['./username.component.scss'],
})
export class UsernameInfoComponent implements OnInit {
  private profileService = inject(ProfileService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private userService = inject(UserService);

  @Input({ required: true }) user!: Signal<UserInterface | null>;

  isLoading = signal(false);
  referralStats = signal<any>(null);
  usernameForm!: FormGroup;

  username = computed(() => {
    return this.usernameForm?.get('username')?.value || 'yourname';
  });

  private restrictedWords = RESTRICTEDWORDS;

  ngOnInit(): void {
    this.initializeForm();

    this.updateFormWithUserData(this.user());
    this.loadReferralStats();
  }

  private initializeForm(): void {
    this.usernameForm = new FormGroup({
      username: new FormControl('', {
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          Validators.pattern(/^[a-zA-Z0-9_]+$/),
          this.restrictedWordsValidator.bind(this),
        ],
        nonNullable: true,
      }),
      userId: new FormControl<string | null>(null),
    });
  }

  private restrictedWordsValidator(control: AbstractControl): ValidationErrors | null {
    const value = (control.value as string)?.toLowerCase().trim();
    if (!value) {
      return null;
    }

    const words = value.split(/\s+/);
    const isRestricted = this.restrictedWords.some((restrictedWord) => {
      const lowerRestricted = restrictedWord.toLowerCase();
      return words.some((word) => word === lowerRestricted);
    });

    return isRestricted ? { restrictedWord: true } : null;
  }

  private updateFormWithUserData(user: UserInterface | null): void {
    if (user) {
      this.usernameForm.patchValue({
        username: user.username,
        userId: user._id,
      });
    }
  }

  private loadReferralStats(): void {
    if (this.user()?._id) {
      this.profileService.getReferralStats(this.user()!._id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.referralStats.set(response.data);
            }
          },
          error: (error) => console.error('Failed to load referral stats:', error)
        });
    }
  }

  async copyReferralLink(): Promise<void> {
    if (this.referralStats()?.referralLink) {
      try {
        await this.profileService.copyReferralLink(this.referralStats().referralLink);
        this.showNotification('Referral link copied to clipboard!', 'success');
      } catch (error) {
        this.showNotification('Failed to copy referral link', 'error');
      }
    }
  }

  onSubmit(): void {
    if (this.usernameForm.invalid) {
      this.usernameForm.markAllAsTouched();
      this.showNotification('Please correct the form errors.', 'error');
      return;
    }

    this.isLoading.set(true);
    const usernameData = this.usernameForm.getRawValue();

    this.profileService
      .updateUsername(usernameData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.showNotification(response.message, 'success');
          this.isLoading.set(false);

          // Refresh user data
          this.userService.getUser(this.user()?.uid || '')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              error: (error) => {
                console.error('Failed to refresh user:', error);
              }
            });

          // Reload referral stats since username changed
          this.loadReferralStats();
        },
        error: (error: HttpErrorResponse) => {
          const errorMessage = error.error?.message || 'Failed to update username. Please try again.';
          this.showNotification(errorMessage, 'error');
          this.isLoading.set(false);
        },
      });
  }

  showHelp(): void {
    this.dialog.open(UsernameDialogComponent, {
      width: '450px',
      data: {
        title: 'Username Guidelines',
        content: `
          <p>Your username will be part of your unique profile URL (marketspase.com/brand_name).</p>
          
          <h4>Requirements:</h4>
          <ul>
            <li>3-30 characters long</li>
            <li>Only letters, numbers and underscores (_)</li>
            <li>No spaces or special characters</li>
            <li>Cannot contain restricted words</li>
          </ul>

          <h4>Good Examples:</h4>
          <ul>
            <li>marketspase.com/marketspase</li>
            <li>marketspase.com/marketspase39</li>
            <li>marketspase.com/market_spase</li>
          </ul>

          <p>Choose something memorable that represents your brand in the MarketSpase community!</p>
        `,
      },
      panelClass: 'help-dialog',
    });
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: [`snackbar-${type}`],
    });
  }
}