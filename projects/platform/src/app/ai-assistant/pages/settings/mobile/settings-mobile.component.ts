import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AiAssistantSettingsAPiService } from '../../../services/ai-assistant-api.service';
import { AvailableStore, SubscriptionPlan, WhatsAppConnection } from '../models/settings.model';
import { AiAssistantSettingsService } from '../services/settings.service';
import { SettingsComponent } from '../settings.component';

type SettingsSection = 'whatsapp' | 'business' | 'notifications' | 'subscription' | 'twilio';

@Component({
  selector: 'app-settings-mobile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  templateUrl: './settings-mobile.component.html',
  styleUrls: ['./settings-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AiAssistantSettingsService, AiAssistantSettingsAPiService],
})
export class SettingsMobileComponent extends SettingsComponent {
  readonly pendingRemoval = signal<WhatsAppConnection | null>(null);

  readonly sections: Array<{ id: SettingsSection; label: string; icon: string; helper: string }> = [
    { id: 'whatsapp', label: 'WhatsApp', icon: 'chat', helper: 'Numbers and AI status' },
    { id: 'business', label: 'Business', icon: 'store', helper: 'Storefront link' },
    { id: 'notifications', label: 'Alerts', icon: 'notifications', helper: 'Message notices' },
    { id: 'subscription', label: 'Plan', icon: 'workspace_premium', helper: 'Billing and limits' },
    { id: 'twilio', label: 'Twilio', icon: 'settings_applications', helper: 'API credentials' },
  ];

  selectSection(section: SettingsSection): void {
    this.activeSection = section;
  }

  requestRemoveConnection(connection: WhatsAppConnection): void {
    this.pendingRemoval.set(connection);
  }

  cancelRemoveConnection(): void {
    this.pendingRemoval.set(null);
  }

  confirmRemoveConnection(): void {
    const connection = this.pendingRemoval();
    if (!connection) return;
    this.removeWhatsAppConnection(connection.phoneNumber);
    this.pendingRemoval.set(null);
  }

  connectedCount(connections: WhatsAppConnection[] = []): number {
    return connections.filter(connection => connection.isConnected).length;
  }

  aiEnabledCount(connections: WhatsAppConnection[] = []): number {
    return connections.filter(connection => connection.aiEnabled).length;
  }

  selectedStoreName(stores: AvailableStore[] = []): string {
    const selectedBusinessId = this.businessForm?.value?.businessId;
    return stores.find(store => store.id === selectedBusinessId)?.name || 'No storefront selected';
  }

  planActionLabel(plan: SubscriptionPlan): string {
    return plan.priceNaira > 3000 ? `Upgrade to ${plan.name}` : 'Move to Basic';
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  trackConnection(_: number, item: WhatsAppConnection): string {
    return item.id || item.phoneNumber;
  }
}
