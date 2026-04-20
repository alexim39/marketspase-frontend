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
  templateUrl: './username.component.html',
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


  // Add methods to username.component.ts
shareOnWhatsApp(): void {
  const message = `Join me on MarketSpase! Use my referral link to sign up and earn bonuses: ${this.referralStats()?.referralLink}`;
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

shareOnFacebook(): void {
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.referralStats()?.referralLink)}`;
  window.open(url, '_blank');
}
}