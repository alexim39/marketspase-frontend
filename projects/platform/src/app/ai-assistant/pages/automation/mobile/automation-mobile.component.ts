import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AiAssistantService } from '../../../services/ai-assistant.service';
import { AutomationComponent } from '../automation.component';

type AutomationSheet = 'reply' | 'escalation' | 'links' | 'response' | null;

@Component({
  selector: 'app-automation-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './automation-mobile.component.html',
  styleUrls: ['./automation-mobile.component.scss'],
  providers: [AiAssistantService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutomationMobileComponent extends AutomationComponent {
  protected readonly activeSheet = signal<AutomationSheet>(null);

  protected readonly enabledEscalationRules = computed(() => {
    const rules = this.settings().escalationRules;
    return [
      rules.escalateOnKeywords,
      rules.lowConfidence,
      rules.complaints,
      rules.highValue,
    ].filter(Boolean).length;
  });

  protected readonly linkReadiness = computed(() => {
    const links = this.settings().autoLinks;
    return [
      !!links.storefrontUrl?.trim(),
      !!links.paymentLink?.trim(),
      ...links.productLinks.map(link => !!link.label?.trim() && !!link.url?.trim()),
    ].filter(Boolean).length;
  });

  protected readonly responseSummary = computed(() => {
    const response = this.settings().responseSettings;
    return `${response.responseDelaySeconds}s delay, ${response.maxAiRepliesBeforeEscalation} replies max`;
  });

  protected openSheet(sheet: Exclude<AutomationSheet, null>): void {
    this.activeSheet.set(sheet);
  }

  protected closeSheet(): void {
    this.activeSheet.set(null);
  }

  protected saveAndClose(): void {
    this.saveSettings();
    this.closeSheet();
  }
}
