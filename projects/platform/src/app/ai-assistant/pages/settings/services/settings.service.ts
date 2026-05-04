// src/app/features/ai-assistant/services/settings.service.ts
import { inject, Injectable, Signal } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { 
  WhatsAppConnection, 
  SubscriptionPlan, 
  NotificationPreferences,
  BusinessInfo 
} from '../models/settings.model';
import { UserInterface } from '@shared/services';
import { UserService } from '../../../../common/services/user.service';
import { AiAssistantSettingsAPiService } from './settings.service-api';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class AiAssistantSettingsService {
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  
  public user: Signal<UserInterface | null> = this.userService.user;

  private loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  // WhatsApp connections
  private whatsappConnections = new BehaviorSubject<WhatsAppConnection[]>([]);
  whatsappConnections$ = this.whatsappConnections.asObservable();

  // Subscription
  private subscriptionPlans = new BehaviorSubject<SubscriptionPlan[]>([]);
  subscriptionPlans$ = this.subscriptionPlans.asObservable();

  private currentPlanId = new BehaviorSubject<string>('');
  currentPlanId$ = this.currentPlanId.asObservable();

  // Business info
  private businessInfo = new BehaviorSubject<BusinessInfo>({
    businessId: '',
    businessName: '',
    availableStores: []
  });
  businessInfo$ = this.businessInfo.asObservable();

  // Notification preferences
  private notificationPrefs = new BehaviorSubject<NotificationPreferences>({
    newMessage: false,
    escalation: false,
    paymentConfirmation: false
  });
  notificationPrefs$ = this.notificationPrefs.asObservable();

  constructor(private api: AiAssistantSettingsAPiService) {}

  // ── WhatsApp Connections ──
  loadWhatsAppConnections(): void {
    this.setLoading(true);
    this.api.getWhatsAppConnections(this.user()?._id ?? '').pipe(
      tap(connections => this.whatsappConnections.next(connections)),
      finalize(() => this.setLoading(false))
    ).subscribe();
  }

  addWhatsAppConnection(phoneNumber: string): void {
    this.api.addWhatsAppConnection(this.user()?._id ?? '', phoneNumber).pipe(
      tap(newConn => {
        const current = this.whatsappConnections.value;
        this.whatsappConnections.next([...current, newConn]);
        this.showSuccess('WhatsApp number added');
      }),
      catchError(err => {
        this.showError('Failed to add number');
        return of(null);
      })
    ).subscribe();
  }

  removeWhatsAppConnection(phoneNumber: string): void {
    this.api.removeWhatsAppConnection(this.user()?._id ?? '', phoneNumber).pipe(
      tap(() => {
        const connections = this.whatsappConnections.value.filter(c => c.id !== phoneNumber);
        this.whatsappConnections.next(connections);
        this.showSuccess('Number removed');
      }),
      catchError(err => {
        this.showError('Could not remove number');
        return of(null);
      })
    ).subscribe();
  }

  toggleAIForConnection(phoneNumber: string, enable: boolean): void {
    this.api.toggleAIForConnection(this.user()?._id ?? '', phoneNumber, enable).pipe(
      tap(updated => {
        const connections = this.whatsappConnections.value.map(c =>
          c.id === phoneNumber ? updated : c
        );
        this.whatsappConnections.next(connections);
      }),
      catchError(err => {
        this.showError('Failed to toggle AI');
        return of(null);
      })
    ).subscribe();
  }

  reconnectConnection(phoneNumber: string): void {
    this.api.reconnectConnection(this.user()?._id ?? '', phoneNumber).pipe(
      tap(updated => {
        const connections = this.whatsappConnections.value.map(c =>
          c.id === phoneNumber ? updated : c
        );
        this.whatsappConnections.next(connections);
        this.showSuccess('Reconnected');
      }),
      catchError(err => {
        this.showError('Reconnection failed');
        return of(null);
      })
    ).subscribe();
  }

  // ── Subscription Plans ──
  loadSubscriptionPlans(): void {
    this.setLoading(true);
    this.api.getSubscriptionPlans(this.user()?._id ?? '').pipe(
      tap(plans => this.subscriptionPlans.next(plans)),
      finalize(() => this.setLoading(false))
    ).subscribe();
  }

  loadCurrentPlan(): void {
    this.api.getCurrentPlan(this.user()?._id ?? '').pipe(
      tap(response => this.currentPlanId.next(response.planId))
    ).subscribe();
  }

  updateSubscriptionPlan(planId: string): void {
    this.setLoading(true);
    this.api.updateSubscriptionPlan(this.user()?._id ?? '', planId).pipe(
      tap(() => {
        this.currentPlanId.next(planId);
        this.showSuccess('Subscription updated');
      }),
      catchError(err => {
        this.showError('Upgrade failed. Check your balance.');
        return of(null);
      }),
      finalize(() => this.setLoading(false))
    ).subscribe();
  }

  // ── Business Info ──
  loadBusinessInfo(): void {
    this.api.getBusinessInfo(this.user()?._id ?? '').pipe(
      tap(info => {
        //console.log('Loaded business info:', info);
        this.businessInfo.next({
          businessId: info.businessId,
          businessName: info.businessName,
          availableStores: info.availableStores
        });
      })
    ).subscribe();
  }

  updateBusinessInfo(businessId: string): void {
    this.api.updateBusinessInfo(this.user()?._id ?? '', businessId).pipe(
      tap(updated => {
        const current = this.businessInfo.value;
        this.businessInfo.next({
          ...current,
          businessId: updated.businessId,
          businessName: updated.businessName
        });
        this.showSuccess('Business updated');
      }),
      catchError(err => {
        this.showError('Could not update business');
        return of(null);
      })
    ).subscribe();
  }

  // ── Notification Preferences ──
  loadNotificationPreferences(): void {
    this.api.getNotificationPreferences(this.user()?._id ?? '').pipe(
      tap(prefs => this.notificationPrefs.next(prefs))
    ).subscribe();
  }

  updateNotificationPreferences(prefs: NotificationPreferences): void {
    this.api.updateNotificationPreferences(this.user()?._id ?? '', prefs).pipe(
      tap(() => {
        this.notificationPrefs.next(prefs);
        this.showSuccess('Preferences saved');
      }),
      catchError(err => {
        this.showError('Failed to save preferences');
        return of(null);
      })
    ).subscribe();
  }

  // ── Helpers ──
  private setLoading(value: boolean): void {
    this.loading.next(value);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000, panelClass: 'snack-success' });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 5000, panelClass: 'snack-error' });
  }
}