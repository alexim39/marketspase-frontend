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
import { MatSnackBarModule } from '@angular/material/snack-bar'; // <-- Add this
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { map, Observable, Subscription } from 'rxjs';
import { AddNumberDialogComponent } from '../../components/add-number-dialog/add-number-dialog.component';
import { 
  WhatsAppConnection, 
  SubscriptionPlan, 
  NotificationPreferences,
  BusinessInfo,
  AvailableStore
} from './models/settings.model';
import { AiAssistantSettingsService } from './services/settings.service';
import { AiAssistantSettingsAPiService } from './services/settings.service-api';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,   // <-- Add this
    ReactiveFormsModule,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  providers: [AiAssistantSettingsService, AiAssistantSettingsAPiService]
})
export class SettingsComponent implements OnInit, OnDestroy {
  private service = inject(AiAssistantSettingsService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  whatsappConnections$!: Observable<WhatsAppConnection[]>;
  subscriptionPlans$!: Observable<SubscriptionPlan[]>;
  currentPlanId$!: Observable<string>;
  businessInfo$!: Observable<BusinessInfo>;
  notificationPrefs$!: Observable<NotificationPreferences>;
  availableStores$!: Observable<AvailableStore[]>;

  businessForm!: FormGroup;
  notificationForm!: FormGroup;

  private sub = new Subscription();

  ngOnInit(): void {
    this.service.loadWhatsAppConnections();
    this.service.loadSubscriptionPlans();
    this.service.loadBusinessInfo();
    this.service.loadNotificationPreferences();

    this.whatsappConnections$ = this.service.whatsappConnections$;
    this.subscriptionPlans$ = this.service.subscriptionPlans$;
    this.currentPlanId$ = this.service.currentPlanId$;
    this.businessInfo$ = this.service.businessInfo$;
    this.notificationPrefs$ = this.service.notificationPrefs$;

    this.availableStores$ = this.businessInfo$.pipe(map(info => info.availableStores));

    this.businessForm = this.fb.group({
      businessId: ['', Validators.required]
    });
    this.sub.add(
      this.businessInfo$.subscribe(info => {
        this.businessForm.patchValue({ businessId: info.businessId }, { emitEvent: false });
      })
    );

    this.notificationForm = this.fb.group({
      newMessage: [false],
      escalation: [false],
      paymentConfirmation: [false]
    });
    this.sub.add(
      this.notificationPrefs$.subscribe(prefs => {
        this.notificationForm.patchValue(prefs, { emitEvent: false });
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  openAddNumberDialog(): void {
    const dialogRef = this.dialog.open(AddNumberDialogComponent, {
      width: '400px'
    });
    dialogRef.afterClosed().subscribe((phone: string) => {
      if (phone) {
        this.service.addWhatsAppConnection(phone);
      }
    });
  }

  removeConnection(id: string): void {
    this.service.removeWhatsAppConnection(id);
  }

  toggleAIForConnection(id: string, event: any): void {
    const enable = event.checked;
    this.service.toggleAIForConnection(id, enable);
  }

  reconnectConnection(id: string): void {
    this.service.reconnectConnection(id);
  }

  saveBusinessName(): void {
    const businessId = this.businessForm.value.businessId;
    this.service.updateBusinessInfo(businessId);
  }

  saveNotificationPreferences(): void {
    const prefs: NotificationPreferences = this.notificationForm.value;
    this.service.updateNotificationPreferences(prefs);
  }

  upgradeTo(planId: string): void {
    this.service.updateSubscriptionPlan(planId);
  }
}