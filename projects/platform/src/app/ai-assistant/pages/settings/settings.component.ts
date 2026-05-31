import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { map, Observable, Subscription } from 'rxjs';
import { AddNumberDialogComponent } from '../../components/add-number-dialog/add-number-dialog.component';
import { WhatsAppConnection, SubscriptionPlan, NotificationPreferences, BusinessInfo, AvailableStore } from './models/settings.model';
import { AiAssistantSettingsService } from './services/settings.service';
import { AiAssistantSettingsAPiService } from '../../services/ai-assistant-api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatSlideToggleModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatTooltipModule, MatDividerModule, ReactiveFormsModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  providers: [AiAssistantSettingsService, AiAssistantSettingsAPiService]
})
export class SettingsComponent implements OnInit, OnDestroy {
  protected service = inject(AiAssistantSettingsService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  whatsappConnections$!: Observable<WhatsAppConnection[]>;
  subscriptionPlans$!: Observable<SubscriptionPlan[]>;
  currentPlanId$!: Observable<string>;
  businessInfo$!: Observable<BusinessInfo>;
  notificationPrefs$!: Observable<NotificationPreferences>;
  availableStores$!: Observable<AvailableStore[]>;

  businessForm!: FormGroup;
  notificationForm!: FormGroup;
  twilioForm!: FormGroup;
  
  loading = false;
  upgradingPlan = false;
  activeSection: 'whatsapp' | 'business' | 'notifications' | 'subscription' | 'twilio' = 'whatsapp';
  
  private sub = new Subscription();
  ngOnInit(): void {
    this.service.loadWhatsAppConnections();
    this.service.loadCurrentPlan();
    this.service.loadBusinessInfo();
    this.service.loadNotificationPreferences();

    this.whatsappConnections$ = this.service.whatsappConnections$;
    this.subscriptionPlans$ = this.service.subscriptionPlans$;
    this.currentPlanId$ = this.service.currentPlanId$;
    this.businessInfo$ = this.service.businessInfo$;
    this.notificationPrefs$ = this.service.notificationPrefs$;
    this.availableStores$ = this.businessInfo$.pipe(map(info => info.availableStores));

    this.businessForm = this.fb.group({ businessId: ['', Validators.required] });
    this.sub.add(this.businessInfo$.subscribe(info => {
      this.businessForm.patchValue({ businessId: info.businessId }, { emitEvent: false });
    }));

    this.notificationForm = this.fb.group({ 
      newMessage: [false], 
      escalation: [false], 
      paymentConfirmation: [false] 
    });
    this.sub.add(this.notificationPrefs$.subscribe(prefs => {
      this.notificationForm.patchValue(prefs, { emitEvent: false });
    }));

    // Twilio config form for WhatsApp setup
    this.twilioForm = this.fb.group({
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      phoneNumberSid: [''],
      accountSid: ['', Validators.required],
      authToken: ['', Validators.required]
    });
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  openAddNumberDialog(): void {
    const dialogRef = this.dialog.open(AddNumberDialogComponent, { width: '450px', maxWidth: '95vw' });
    dialogRef.afterClosed().subscribe((phone: string) => { 
      if (phone) this.service.addWhatsAppConnection(phone); 
    });
  }

  removeConnection(phoneNumber: string): void { 
    if (confirm('Remove this WhatsApp number?')) {
      this.removeWhatsAppConnection(phoneNumber);
    }
  }

  protected removeWhatsAppConnection(phoneNumber: string): void {
    this.service.removeWhatsAppConnection(phoneNumber);
  }
  
  toggleAIForConnection(phoneNumber: string, event: any): void { 
    this.service.toggleAIForConnection(phoneNumber, event.checked); 
  }
  
  reconnectConnection(phoneNumber: string): void { 
    this.service.reconnectConnection(phoneNumber); 
  }

  saveBusinessName(): void {
    if (this.businessForm.valid) {
      this.service.updateBusinessInfo(this.businessForm.value.businessId);
    }
  }

  saveNotificationPreferences(): void {
    const prefs: NotificationPreferences = this.notificationForm.value;
    this.service.updateNotificationPreferences(prefs);
  }

  upgradeTo(planId: string): void { 
    this.upgradingPlan = true;
    this.service.updateSubscriptionPlan(planId);
    setTimeout(() => this.upgradingPlan = false, 3000);
  }

  saveTwilioConfig(): void {
    if (this.twilioForm.valid) {
      this.loading = true;
      this.service.saveWhatsAppConfig(this.twilioForm.value).subscribe({
        next: (connection) => {
          this.loading = false;
          if (connection) this.twilioForm.reset();
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Twilio configuration failed', 'Close', { duration: 5000 });
        }
      });
    }
  }

  getPlanIcon(planId: string): string {
    return planId === 'advanced' ? 'workspace_premium' : 'check_circle';
  }
}
