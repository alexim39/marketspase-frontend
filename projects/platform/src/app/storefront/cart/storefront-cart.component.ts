import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { CurrencyUtilsPipe } from '@shared/services';
import { UserService } from '../../common/services/user.service';
import { PaystackService } from '../../common/services/paystack.service';
import { StorefrontCartGroup, StorefrontCartItem, StorefrontCartService } from '../services/storefront-cart.service';
import { StorefrontService } from '../services/storefront.service';
import { CurrencyQuote, PaymentCurrencyService } from '../../common/services/payment-currency.service';

@Component({
  selector: 'app-storefront-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    CurrencyUtilsPipe
  ],
  providers: [StorefrontService, PaystackService],
  templateUrl: './storefront-cart.component.html',
  styleUrls: ['./storefront-cart.component.scss']
})
export class StorefrontCartComponent implements OnInit {
  private readonly cartService = inject(StorefrontCartService);
  private readonly storeService = inject(StorefrontService);
  private readonly userService = inject(UserService);
  private readonly paystackService = inject(PaystackService);
  private readonly paymentCurrencyService = inject(PaymentCurrencyService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly user = this.userService.user;
  readonly groups = this.cartService.groups;
  readonly itemCount = this.cartService.itemCount;
  readonly cartTotal = this.cartService.subtotal;

  readonly selectedStoreId = signal<string | null>(null);
  readonly checkoutLoading = signal(false);
  readonly checkoutError = signal<string | null>(null);
  readonly checkoutSuccess = signal<any | null>(null);
  readonly selectedCheckoutCurrency = signal<string>('NGN');
  readonly supportedCheckoutCurrencies = signal<Array<{ code: string; name: string; symbol: string }>>([]);
  readonly checkoutQuote = signal<CurrencyQuote | null>(null);

  readonly selectedGroup = computed(() => {
    const groups = this.groups();
    return groups.find(group => group.storeId === this.selectedStoreId()) || groups[0] || null;
  });

  readonly checkoutForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    street: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    country: ['Nigeria', [Validators.required]],
    postalCode: ['']
  });

  constructor() {
    effect(() => {
      const group = this.selectedGroup();
      const currency = this.selectedCheckoutCurrency();

      if (!group || !currency) {
        this.checkoutQuote.set(null);
        return;
      }

      this.refreshCheckoutQuote();
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.selectedStoreId.set(this.groups()[0]?.storeId || null);
    this.prefillCheckoutForm();
    this.loadCheckoutCurrencyConfig();
  }

  selectGroup(group: StorefrontCartGroup): void {
    this.selectedStoreId.set(group.storeId);
    this.checkoutError.set(null);
  }

  increaseQuantity(item: StorefrontCartItem): void {
    this.cartService.updateQuantity(item.id, item.quantity + 1);
  }

  decreaseQuantity(item: StorefrontCartItem): void {
    this.cartService.updateQuantity(item.id, item.quantity - 1);
  }

  removeItem(item: StorefrontCartItem): void {
    this.cartService.removeItem(item.id);
    this.resetSelectedStoreIfNeeded();
  }

  clearSelectedStore(): void {
    const group = this.selectedGroup();
    if (!group) return;
    this.cartService.clearStore(group.storeId);
    this.resetSelectedStoreIfNeeded();
  }

  async checkoutSelectedStore(): Promise<void> {
    const group = this.selectedGroup();
    const currentUser = this.user();

    if (!group) {
      this.checkoutError.set('Your cart is empty.');
      return;
    }

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.checkoutError.set('Please complete the delivery details.');
      return;
    }

    this.checkoutLoading.set(true);
    this.checkoutError.set(null);
    this.checkoutSuccess.set(null);

    try {
      const formValue = this.checkoutForm.getRawValue();
      const customerEmail = formValue.email || currentUser?.email || '';
      const customerName = formValue.fullName || currentUser?.displayName || currentUser?.username || '';
      const customerPhone = formValue.phone || currentUser?.personalInfo?.phone || currentUser?.personalInfo?.phoneDetails?.fullNumber || '';
      const orderPayload: any = {
        items: group.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          trackingCode: item.trackingCode,
          ref: item.uniqueId
        })),
        checkoutCurrency: this.selectedCheckoutCurrency(),
        checkoutQuote: this.checkoutQuote(),
        shippingAddress: {
          fullName: customerName,
          email: customerEmail,
          phone: customerPhone,
          street: formValue.street,
          city: formValue.city,
          state: formValue.state,
          country: formValue.country || 'Nigeria',
          postalCode: formValue.postalCode || ''
        },
        paymentMethod: 'paystack'
      };

      if (currentUser?._id) {
        orderPayload.customerId = currentUser._id;
      }

      const createResponse = await firstValueFrom(this.storeService.createStorefrontOrder(orderPayload));

      const order = createResponse?.data?.order;
      const checkout = createResponse?.data?.checkout;
      if (!order?._id || !checkout?.reference) {
        throw new Error('Checkout could not be initialized.');
      }

      const paymentResult = await firstValueFrom(this.paystackService.initiatePayment({
        amount: checkout.amount,
        currency: checkout.currency || group.currency || 'NGN',
        reference: checkout.reference,
        user: currentUser || undefined,
        customer: {
          email: customerEmail,
          fullName: customerName,
          phone: customerPhone
        },
        metadata: {
          orderId: order._id,
          storeId: group.storeId,
          itemCount: group.itemCount
        }
      }));

      if (!paymentResult.success || !paymentResult.response) {
        throw new Error(paymentResult.error || 'Payment was not completed.');
      }

      const confirmPayload: any = {
        paymentReference: checkout.reference,
        paystackResult: paymentResult.response
      };

      if (currentUser?._id) {
        confirmPayload.customerId = currentUser._id;
      }

      const confirmResponse = await firstValueFrom(this.storeService.confirmStorefrontPayment(order._id, confirmPayload));

      this.cartService.clearStore(group.storeId);
      this.resetSelectedStoreIfNeeded();
      this.checkoutSuccess.set(confirmResponse?.data?.order || order);
      this.snackBar.open('Order paid successfully. Details have been sent to your email.', 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });
    } catch (error: any) {
      this.checkoutError.set(error?.error?.message || error?.message || 'Checkout failed. Please try again.');
    } finally {
      this.checkoutLoading.set(false);
    }
  }

  continueShopping(): void {
    const group = this.selectedGroup() || this.groups()[0];
    if (group?.storeLink) {
      this.router.navigate(['/store', group.storeLink]);
      return;
    }
    this.router.navigate(['/']);
  }

  itemSubtotal(item: StorefrontCartItem): number {
    return item.price * item.quantity;
  }

  onCheckoutCurrencyChange(currencyCode: string): void {
    this.selectedCheckoutCurrency.set(currencyCode || this.selectedGroup()?.currency || 'NGN');
  }

  private prefillCheckoutForm(): void {
    const currentUser = this.user();
    const address = currentUser?.personalInfo?.address as any;

    this.checkoutForm.patchValue({
      fullName: currentUser?.displayName || '',
      email: currentUser?.email || '',
      phone: currentUser?.personalInfo?.phone || currentUser?.personalInfo?.phoneDetails?.fullNumber || '',
      street: address?.street || '',
      city: address?.city || '',
      state: address?.state || '',
      country: address?.country || 'Nigeria',
      postalCode: address?.postalCode || ''
    });
  }

  private resetSelectedStoreIfNeeded(): void {
    const groups = this.groups();
    const current = this.selectedStoreId();
    if (!current || !groups.some(group => group.storeId === current)) {
      this.selectedStoreId.set(groups[0]?.storeId || null);
    }
  }

  private loadCheckoutCurrencyConfig(): void {
    this.paymentCurrencyService.getConfig().subscribe({
      next: (response) => {
        const supported = (response?.data?.supportedCurrencies || [])
          .filter((currency) => currency?.capabilities?.checkout)
          .map((currency) => ({
            code: currency.code,
            name: currency.name,
            symbol: currency.symbol,
          }));
        this.supportedCheckoutCurrencies.set(supported);
        const currentGroupCurrency = this.selectedGroup()?.currency || 'NGN';
        const preferredCurrency = this.user()?.preferences?.financial?.displayCurrency || currentGroupCurrency;
        const initialCurrency = supported.find((currency) => currency.code === preferredCurrency)?.code
          || supported.find((currency) => currency.code === currentGroupCurrency)?.code
          || supported[0]?.code
          || currentGroupCurrency;
        this.selectedCheckoutCurrency.set(initialCurrency);
      },
      error: () => {
        this.supportedCheckoutCurrencies.set([{ code: 'NGN', name: 'Nigerian Naira', symbol: 'NGN' }]);
        this.selectedCheckoutCurrency.set(this.selectedGroup()?.currency || 'NGN');
      }
    });
  }

  private refreshCheckoutQuote(): void {
    const group = this.selectedGroup();
    if (!group?.subtotal || group.subtotal <= 0) {
      this.checkoutQuote.set(null);
      return;
    }

    this.paymentCurrencyService.getQuote({
      amount: group.subtotal,
      fromCurrency: group.currency || 'NGN',
      toCurrency: this.selectedCheckoutCurrency() || group.currency || 'NGN',
      purpose: 'storefront_checkout',
    }).subscribe({
      next: (response) => {
        this.checkoutQuote.set(response?.data || null);
      },
      error: () => {
        this.checkoutQuote.set(null);
      }
    });
  }
}
