import { Component, signal, inject, OnDestroy, computed } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-index',
  standalone: true,
  providers: [AuthService],
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-container">
        <div class="login-header">
          <div class="logo">
            <div class="logo-icon">
               <img src="/img/x_logo.png">
            </div>
          </div>
          <h1>MarketSpase Admin</h1>
          <p class="subtitle">Access the administrator dashboard</p>
        </div>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="email">Admin Email</label>
            <div class="input-with-icon">
              <i class="fas fa-user"></i>
              <input 
                type="email" 
                id="email" 
                formControlName="email"
                placeholder="admin@marketspase.com"
                [class.error]="showEmailErrors()">
            </div>
            @if (showEmailErrors()) {
              <div class="error-message">
                @if (loginForm.get('email')?.hasError('required')) {
                  <span>Email is required</span>
                }
                @if (loginForm.get('email')?.hasError('email')) {
                  <span>Please enter a valid email address</span>
                }
              </div>
            }
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-with-icon">
              <i class="fas fa-lock"></i>
              <input 
                type="password" 
                id="password" 
                formControlName="password"
                placeholder="Enter your password"
                [class.error]="showPasswordErrors()">
            </div>
            @if (showPasswordErrors()) {
              <div class="error-message">
                @if (loginForm.get('password')?.hasError('required')) {
                  <span>Password is required</span>
                }
                @if (loginForm.get('password')?.hasError('minlength')) {
                  <span>Password must be at least 6 characters</span>
                }
              </div>
            }
          </div>
          
          <button 
            type="submit" 
            class="btn-login" 
            [disabled]="isSubmitting()">
            {{ isSubmitting() ? 'Logging in...' : 'Login to Dashboard' }}
          </button>
          
          <div class="additional-options">
            <div class="remember-me">
              <input type="checkbox" id="remember" formControlName="rememberMe">
              <label for="remember">Remember me</label>
            </div>
            <a href="#" class="forgot-password">Forgot Password?</a>
          </div>
          
          @if (errorMessage()) {
            <div class="error-notice">
              <p><i class="fas fa-exclamation-circle"></i> {{ errorMessage() }}</p>
            </div>
          }
          
          <div class="security-notice">
            <p><i class="fas fa-shield-alt"></i> Secure admin access only. All activities are logged and monitored.</p>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./index.component.scss']
})
export class IndexComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private subscriptions: Subscription = new Subscription();

  // State signals
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  // Reactive form
  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  // Computed signals for error display
  showEmailErrors = computed(() => 
    this.loginForm.controls.email.invalid && 
    (this.loginForm.controls.email.dirty || this.loginForm.controls.email.touched)
  );

  showPasswordErrors = computed(() => 
    this.loginForm.controls.password.invalid && 
    (this.loginForm.controls.password.dirty || this.loginForm.controls.password.touched)
  );

  onSubmit() {
    // Mark all fields as touched to trigger validation messages
    this.loginForm.markAllAsTouched();
    
    if (this.loginForm.invalid) {
      this.errorMessage.set('Please correct the errors above');
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const credentials = this.loginForm.getRawValue();
    
    const authSubscription = this.authService.signIn(credentials).subscribe({
      next: () => {
        localStorage.setItem('isAuthenticated', 'true');
        // On successful authentication
        this.router.navigate(['/dashboard']);
        this.isSubmitting.set(false);
      },
      error: (error) => {
        console.log('the erorr',error)
        this.handleAuthError(error);
        this.isSubmitting.set(false);
      }
    });
    
    this.subscriptions.add(authSubscription);
  }

  private handleAuthError(error: unknown) {
    if (error instanceof Error) {
      this.errorMessage.set(error.message);
    } else {
      this.errorMessage.set('An unexpected error occurred. Please try again.');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}