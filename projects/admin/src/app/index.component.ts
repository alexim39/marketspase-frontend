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
              <i class="fa fa-refresh"></i>
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
  styles: [`
    .login-wrapper {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      width: 100%;
    }
    
    .login-container {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 420px;
      overflow: hidden;
    }
    
    .login-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    
    .logo {
      display: flex;
      justify-content: center;
      margin-bottom: 15px;
    }
    
    .logo-icon {
      background-color: white;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #667eea;
      font-size: 22px;
    }
    
    h1 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .subtitle {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .login-form {
      padding: 30px;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #2d3748;
      font-size: 14px;
    }
    
    .input-with-icon {
      position: relative;
    }
    
    .input-with-icon i {
      position: absolute;
      left: 15px;
      top: 50%;
      transform: translateY(-50%);
      color: #718096;
    }
    
    .input-with-icon input {
      padding-left: 45px;
    }
    
    input {
      width: 100%;
      padding: 14px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 15px;
      transition: all 0.3s ease;
    }
    
    input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
    }
    
    input.error {
      border-color: #e53e3e;
      box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.15);
    }
    
    .error-message {
      color: #e53e3e;
      font-size: 12px;
      margin-top: 5px;
    }
    
    .error-notice {
      margin-top: 20px;
      padding: 15px;
      background-color: #fed7d7;
      border-radius: 8px;
      border-left: 4px solid #e53e3e;
      font-size: 13px;
      color: #742a2a;
    }
    
    .error-notice i {
      color: #e53e3e;
      margin-right: 8px;
    }
    
    .btn-login {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 10px;
    }
    
    .btn-login:hover:not(:disabled) {
      background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
    }
    
    .btn-login:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }
    
    .btn-login:active {
      transform: translateY(0);
    }
    
    .additional-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
      font-size: 14px;
    }
    
    .remember-me {
      display: flex;
      align-items: center;
    }
    
    .remember-me input {
      width: auto;
      margin-right: 8px;
    }
    
    .forgot-password {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }
    
    .forgot-password:hover {
      text-decoration: underline;
    }
    
    .security-notice {
      margin-top: 25px;
      padding: 15px;
      background-color: #f8fafc;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      font-size: 13px;
      color: #718096;
    }
    
    .security-notice i {
      color: #667eea;
      margin-right: 8px;
    }
    
    @media (max-width: 480px) {
      .login-container {
        max-width: 100%;
      }
      
      .login-form {
        padding: 20px;
      }
      
      .additional-options {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
    }
  `]
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