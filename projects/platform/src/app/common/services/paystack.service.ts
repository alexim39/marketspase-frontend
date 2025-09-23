import { Injectable, Inject, Optional, OnDestroy, DestroyRef, inject } from '@angular/core';
import { Observable, Subject, takeUntil, throwError } from 'rxjs';
import { UserInterface } from '../../../../../shared-services/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Configuration interface for better type safety
export interface PaystackConfig {
  publicKey: string;
  currency?: string;
  defaultEmailDomain?: string;
}

// Payment request interface
export interface PaymentRequest {
  amount: number;
  user: UserInterface;
  metadata?: Record<string, any>;
  currency?: string;
  reference?: string;
}

// Payment response interfaces
export interface PaymentResponse {
  reference: string;
  status: string;
  trans: string;
  transaction: string;
  trxref: string;
  redirecturl: string;
}

export interface PaymentResult {
  success: boolean;
  response?: PaymentResponse;
  error?: string;
  amount?: number;
}

// Configuration token
export const PAYSTACK_CONFIG = 'PAYSTACK_CONFIG';

@Injectable()
export class PaystackService {
  private readonly defaultConfig: PaystackConfig = {
    publicKey: 'pk_test_1d5627d8d06cb2c937cee6ce4b0ed56c7fe2159a',
    currency: 'NGN',
    defaultEmailDomain: 'marketspase.com'
  };

  private config: PaystackConfig;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    @Optional() @Inject(PAYSTACK_CONFIG) injectedConfig: PaystackConfig | null
  ) {
    this.config = { ...this.defaultConfig, ...injectedConfig };
  }

  /**
   * Initiates the payment process using Paystack.
   * Returns an Observable that emits the payment result.
   */
  initiatePayment(request: PaymentRequest): Observable<PaymentResult> {
    const subject = new Subject<PaymentResult>();

    try {
      // Validate the payment request
      const validationError = this.validatePaymentRequest(request);
      if (validationError) {
        return throwError(() => new Error(validationError));
      }

      // Check if Paystack is available
      if (!this.isPaystackAvailable()) {
        return throwError(() => new Error('Paystack library is not loaded. Please ensure Paystack script is included.'));
      }

      const email = this.getUserEmail(request.user);
      const reference = request.reference || this.generateReference();
      const currency = request.currency || this.config.currency;

      const paystackOptions = {
        key: this.config.publicKey,
        email,
        amount: request.amount * 100, // Convert to kobo
        currency,
        ref: reference,
        metadata: {
          custom_fields: this.buildCustomFields(request.user),
          ...request.metadata
        },
        callback: (response: PaymentResponse) => {
          subject.next({
            success: true,
            response,
            amount: request.amount
          });
          subject.complete();
        },
        onClose: () => {
          subject.next({
            success: false,
            error: 'Payment dialog was closed by user'
          });
          subject.complete();
        }
      };

      const handler = (window as any).PaystackPop.setup(paystackOptions);
      handler.openIframe();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      subject.next({
        success: false,
        error: errorMessage
      });
      subject.complete();
    }

    return subject.asObservable();
  }

  /**
   * Alternative method that uses callback pattern for backward compatibility
   */
  initiatePaymentWithCallback(
    request: PaymentRequest,
    onSuccess: (response: PaymentResponse, amount: number) => void,
    onError?: (error: string) => void,
    onClose?: () => void
  ): void {
    this.initiatePayment(request)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (result) => {
        if (result.success && result.response) {
          onSuccess(result.response, result.amount || request.amount);
        } else if (result.error) {
          onError?.(result.error);
        }
      },
      error: (error) => {
        onError?.(error.message || 'Payment initiation failed');
      }
    });

    // Handle close callback separately if provided
    if (onClose) {
      // This would need to be handled in the Paystack options
    }
  }

  /**
   * Validates the payment request
   */
  private validatePaymentRequest(request: PaymentRequest): string | null {
    if (!request) {
      return 'Payment request is required';
    }

    if (!request.amount || typeof request.amount !== 'number') {
      return 'Valid amount is required';
    }

    if (request.amount <= 0) {
      return 'Amount must be greater than zero';
    }

    if (!Number.isFinite(request.amount)) {
      return 'Amount must be a valid number';
    }

    if (!request.user) {
      return 'User information is required';
    }

    if (!request.user.email && !request.user.username) {
      return 'User email or username is required';
    }

    return null;
  }

  /**
   * Generates user email from user object
   */
  private getUserEmail(user: UserInterface): string {
    if (user.email?.trim()) {
      return user.email.trim();
    }

    if (user.username?.trim()) {
      return `${user.username.trim()}@${this.config.defaultEmailDomain}`;
    }

    throw new Error('Unable to generate email for user');
  }

  /**
   * Builds custom fields for Paystack metadata
   */
  private buildCustomFields(user: UserInterface): Array<{ display_name: string; variable_name: string; value: string }> {
    const customFields: Array<{ display_name: string; variable_name: string; value: string }> = [];

    if (user.displayName?.trim()) {
      customFields.push({
        display_name: 'Display Name',
        variable_name: 'display_name',
        value: user.displayName.trim()
      });
    }

    if (user.username?.trim()) {
      customFields.push({
        display_name: 'Username',
        variable_name: 'username',
        value: user.username.trim()
      });
    }

    return customFields;
  }

  /**
   * Generates a unique payment reference
   */
  private generateReference(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ASYNC-${timestamp}-${random}`;
  }

  /**
   * Checks if Paystack library is available
   */
  private isPaystackAvailable(): boolean {
    return !!(window as any).PaystackPop?.setup;
  }

  /**
   * Updates the service configuration
   */
  updateConfig(newConfig: Partial<PaystackConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets the current configuration
   */
  getConfig(): Readonly<PaystackConfig> {
    return { ...this.config };
  }
}