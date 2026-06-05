import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, LocalAuthResponse, SignUpInterface } from './auth.service';

type LocalAuthMode = 'signin' | 'signup' | 'verify' | 'reset-request' | 'reset-confirm';

interface LocalAuthDialogData {
  referralCode?: string | null;
  userDevice?: string | null;
  deviceType?: 'desktop' | 'mobile' | 'tablet' | string;
}

const passwordValidator = Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,80}$/);

@Component({
  selector: 'app-local-auth-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './local-auth-dialog.component.html',
  styleUrls: ['./local-auth-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalAuthDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly localAuth = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<LocalAuthDialogComponent>);
  private readonly data = inject<LocalAuthDialogData>(MAT_DIALOG_DATA, { optional: true }) || {};
  private readonly destroyRef = inject(DestroyRef);

  readonly mode = signal<LocalAuthMode>('signin');
  readonly loading = signal(false);
  readonly serverError = signal('');
  readonly serverMessage = signal('');
  readonly hideSignInPassword = signal(true);
  readonly hideSignUpPassword = signal(true);
  readonly hideResetPassword = signal(true);
  readonly pendingSignup = signal<SignUpInterface | null>(null);
  readonly pendingResetEmail = signal('');

  readonly isVerificationMode = computed(() => this.mode() === 'verify');
  readonly isMobile = computed(() => this.data.deviceType === 'mobile' || this.data.deviceType === 'tablet');

  readonly signInForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly signUpForm = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, passwordValidator]],
    confirmPassword: ['', [Validators.required]],
    acceptTerms: [false, [Validators.requiredTrue]],
  });

  readonly verificationForm = this.fb.group({
    verificationCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  readonly resetRequestForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly resetConfirmForm = this.fb.group({
    verificationCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    password: ['', [Validators.required, passwordValidator]],
    confirmPassword: ['', [Validators.required]],
  });

  setMode(mode: LocalAuthMode): void {
    this.mode.set(mode);
    this.serverError.set('');
    this.serverMessage.set('');
  }

  close(): void {
    this.dialogRef.close();
  }

  submitSignIn(): void {
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set('');

    this.localAuth.signIn({
      email: this.signInForm.controls.email.value || '',
      password: this.signInForm.controls.password.value || '',
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.completeAuth(response),
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          if (error.error?.code === 'LOCAL_PASSWORD_NOT_SET') {
            this.signUpForm.patchValue({ email: this.signInForm.controls.email.value || '' });
            this.setMode('signup');
            this.serverMessage.set('Create a local password for this existing MarketSpase account to continue.');
            return;
          }
          this.serverError.set(this.resolveErrorMessage(error, 'Unable to sign in. Please try again.'));
        },
      });
  }

  submitSignUp(): void {
    if (this.signUpForm.invalid || !this.passwordsMatch(this.signUpForm.value)) {
      this.signUpForm.markAllAsTouched();
      return;
    }

    const payload: SignUpInterface = {
      displayName: this.signUpForm.controls.displayName.value || '',
      email: this.signUpForm.controls.email.value || '',
      password: this.signUpForm.controls.password.value || '',
      referralCode: this.data.referralCode || null,
      userDevice: this.data.userDevice || null,
    };

    this.loading.set(true);
    this.serverError.set('');
    this.serverMessage.set('');

    this.localAuth.signUp(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.handleSignUpResponse(response, payload),
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.serverError.set(this.resolveErrorMessage(error, 'Unable to create your account. Please try again.'));
        },
      });
  }

  submitVerificationCode(): void {
    const pendingSignup = this.pendingSignup();

    if (!pendingSignup || this.verificationForm.invalid) {
      this.verificationForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set('');

    this.localAuth.signUp({
      ...pendingSignup,
      verificationCode: this.verificationForm.controls.verificationCode.value || '',
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.completeAuth(response),
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.serverError.set(this.resolveErrorMessage(error, 'Invalid or expired verification code.'));
        },
      });
  }

  requestPasswordReset(): void {
    if (this.resetRequestForm.invalid) {
      this.resetRequestForm.markAllAsTouched();
      return;
    }

    const email = this.resetRequestForm.controls.email.value || '';
    this.loading.set(true);
    this.serverError.set('');

    this.localAuth.requestPasswordChange({ email })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.pendingResetEmail.set(email);
          this.mode.set('reset-confirm');
          this.serverMessage.set(response.message || 'Enter the reset code sent to your email.');
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.serverError.set(this.resolveErrorMessage(error, 'Unable to request password reset.'));
        },
      });
  }

  confirmPasswordReset(): void {
    if (this.resetConfirmForm.invalid || !this.passwordsMatch(this.resetConfirmForm.value)) {
      this.resetConfirmForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set('');

    this.localAuth.resetPassword({
      email: this.pendingResetEmail(),
      verificationCode: this.resetConfirmForm.controls.verificationCode.value || '',
      password: this.resetConfirmForm.controls.password.value || '',
      userDevice: this.data.userDevice || null,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.completeAuth(response),
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.serverError.set(this.resolveErrorMessage(error, 'Unable to reset password.'));
        },
      });
  }

  passwordMismatch(formValue: Partial<{ password: string | null; confirmPassword: string | null }>): boolean {
    return Boolean(formValue.password && formValue.confirmPassword && formValue.password !== formValue.confirmPassword);
  }

  private passwordsMatch(formValue: Partial<{ password: string | null; confirmPassword: string | null }>): boolean {
    return !this.passwordMismatch(formValue);
  }

  private handleSignUpResponse(response: LocalAuthResponse, payload: SignUpInterface): void {
    this.loading.set(false);

    if (response.requiresEmailVerification) {
      this.pendingSignup.set(payload);
      this.mode.set('verify');
      this.serverMessage.set(response.message || 'Enter the verification code sent to your email.');
      return;
    }

    this.completeAuth(response);
  }

  private completeAuth(response: LocalAuthResponse): void {
    this.loading.set(false);

    if (response.success && response.token) {
      this.localAuth.persistLocalSession(response);
      this.dialogRef.close({ success: true, response });
      return;
    }

    this.serverError.set(response.message || 'Authentication failed. Please try again.');
  }

  private resolveErrorMessage(error: HttpErrorResponse, fallback: string): string {
    return error.error?.message || fallback;
  }
}
