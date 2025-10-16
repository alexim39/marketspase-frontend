import {
  Component,
  inject,
  Input,
  OnInit,
  signal,
  computed,
  effect,
  DestroyRef,
  Signal,
  OnDestroy,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ValidationErrors,
  AbstractControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserInterface } from '../../../../../../shared-services/src/public-api';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
  ],
  template: `
    <mat-card class="username-card">
      <mat-card-header>
        <mat-card-title class="username-title">
          <mat-icon class="username-icon">alternate_email</mat-icon>
          Customize Your Profile URL
        </mat-card-title>
        <mat-card-subtitle class="username-subtitle">
          Choose a unique username that will be part of your profile link
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
                <mat-error >
                  Username is required
                </mat-error>
              }
              @if (usernameForm.get('username')?.hasError('pattern')) {
                <mat-error>
                  Only letters, numbers and underscores allowed
                </mat-error>
              }
              @if (usernameForm.get('username')?.hasError('minlength')) {
                 <mat-error>
                  Minimum 3 characters required
                </mat-error>
              }
              @if (usernameForm.get('username')?.hasError('maxlength')) {
                <mat-error>
                  Maximum 30 characters allowed
                </mat-error>
              }
              @if (usernameForm.get('username')?.hasError('restrictedWord')) {
                <mat-error>
                  This username contains a restricted word.
                </mat-error>
              }
            </mat-form-field>

            <div class="url-preview">
              <div class="preview-label">
                <mat-icon>link</mat-icon>
                <span>Your profile URL will be:</span>
              </div>
              <div class="preview-value">
                marketspase.com/{{ username() | lowercase }}
              </div>
            </div>
          </div>
        </form>
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
          <mat-spinner diameter="20"/>
        }
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
  
    
.username-card {
  margin: 24px auto;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;

  .username-title {
    font-size: 24px;
    font-weight: 500;
    display: flex;
    align-items: center;

    .username-icon {
      margin-right: 12px;
    }
  }

  .username-subtitle {
    font-size: 14px;
    color: #5f6368;
    margin-top: 8px;
  }

  .username-form {
    padding: 24px;

    .form-section {
      .form-field {
        width: 100%;
        margin-bottom: 16px;
      }

      .url-preview {
        margin: 24px 0;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #666;

        .preview-label {
          display: flex;
          align-items: center;
          font-size: 14px;
          margin-bottom: 8px;

          mat-icon {
            margin-right: 8px;
          }
        }

        .preview-value {
          font-size: 16px;
          font-weight: 500;
          word-break: break-all;
        }
      }
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    padding: 16px 24px;

    .cancel-button {
      margin-right: 16px;
    }

    .save-button {
      min-width: 160px;
    }
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .username-card {
    margin: 0;
    border-radius: 0;

    .username-form {
      padding: 16px;
    }
  }
}

// Snackbar styles
.snackbar-success {
  background-color: green;  //mat-color($mat-green, 600);
}

.snackbar-error {
  background-color: red; //mat-color($mat-red, 600);
}

// Help dialog styles
.help-dialog {
  .mat-mdc-dialog-container .mdc-dialog__surface {
    border-radius: 12px !important;
  }

  h4 {
    margin: 16px 0 8px;
  }

  ul {
    padding-left: 24px;
    margin: 8px 0;
  }
}
    
  `]
})
export class UsernameInfoComponent implements OnInit, OnDestroy {
  // Services are now injected directly in the class
  private profileService = inject(ProfileService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private userService = inject(UserService);
  // Input is now a required signal
  @Input({ required: true }) user!: Signal<UserInterface | null>;

  // State management with signals
  isLoading = signal(false);
  usernameForm!: FormGroup;

  // Use a computed signal for the username preview
  // This automatically updates whenever the username form control value changes
  username = computed(() => {
    return this.usernameForm?.get('username')?.value || 'yourname';
  });

  private restrictedWords = RESTRICTEDWORDS;

  constructor() {
    // Create an effect to react to changes in the 'user' input signal
    // This replaces `ngOnChanges` and provides a more reactive approach
    effect(
      () => {
        const userData = this.user();
        if (userData) {
          this.updateFormWithUserData(userData);
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    // this.destroy$.next();
    // this.destroy$.complete();
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

    // Update form with initial user data if available
    if (this.user()) {
      this.updateFormWithUserData(this.user());
    }
  }

  // private restrictedWordsValidator(
  //   control: AbstractControl
  // ): ValidationErrors | null {
  //   const value = (control.value as string)?.toLowerCase();
  //   if (!value) {
  //     return null;
  //   }

  //   const isRestricted = this.restrictedWords.some((word) =>
  //     value.includes(word.toLowerCase())
  //   );

  //   return isRestricted ? { restrictedWord: true } : null;
  // }

  private restrictedWordsValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const value = (control.value as string)?.toLowerCase().trim();
    if (!value) {
      return null;
    }

    // Split the value into words using whitespace as delimiter
    const words = value.split(/\s+/);

    const isRestricted = this.restrictedWords.some((restrictedWord) => {
      const lowerRestricted = restrictedWord.toLowerCase();
      return words.some((word) => word === lowerRestricted);
    });

    return isRestricted ? { restrictedWord: true } : null;
  }

  private updateFormWithUserData(user: UserInterface | null): void {
    this.usernameForm.patchValue({
      username: this.user()?.username,
      userId: this.user()?._id,
    });
  }

  onSubmit(): void {
    if (this.usernameForm.invalid) {
      this.usernameForm.markAllAsTouched();
      this.showNotification(
        'Please correct the form errors.',
        'error'
      );
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

           // get update user record
          this.userService.getUser(this.user()?.uid || '')
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            error: (error) => {
              console.error('Failed to refresh user:', error);
            }
          });

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
          <p>Your username will be part of your unique profile URL (marketspase.com/yourname).</p>
          
          <h4>Requirements:</h4>
          <ul>
            <li>3-30 characters long</li>
            <li>Only letters, numbers and underscores (_)</li>
            <li>No spaces or special characters</li>
            <li>Cannot contain restricted words (async, marketspase)</li>
          </ul>

          <h4>Good Examples:</h4>
          <ul>
            <li>marketspase.com/alexim39</li>
            <li>marketspase.com/alex_imenwo</li>
          </ul>

          <p>Choose something memorable that represents your brand in the MarketSpase community!</p>
        `,
      },
      panelClass: 'help-dialog',
    });
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: [`snackbar-${type}`],
    });
  }
}