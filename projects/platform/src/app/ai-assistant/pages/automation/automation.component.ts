import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AiAssistantService } from '../../services/ai-assistant.service';

interface ProductLink {
  label: string;
  url: string;
}

interface AutomationSettings {
  aiEnabled: boolean;
  tone: 'friendly' | 'professional' | 'sales';
  language: 'english' | 'pidgin';
  escalationRules: {
    escalateOnKeywords: boolean;
    lowConfidence: boolean;
    complaints: boolean;
    highValue: boolean;
    keywords: string[];
  };
  autoLinks: {
    storefrontUrl: string;
    paymentLink: string;
    productLinks: ProductLink[];
  };
  responseSettings: {
    responseDelaySeconds: number;
    maxAiRepliesBeforeEscalation: number;
    businessHours: {
      enabled: boolean;
      start: string;
      end: string;
      timezone: string;
    };
  };
}

const DEFAULT_KEYWORDS = ['human', 'agent', 'speak to someone', 'manager', 'complaint', 'refund'];

const DEFAULT_SETTINGS: AutomationSettings = {
  aiEnabled: false,
  tone: 'friendly',
  language: 'english',
  escalationRules: {
    escalateOnKeywords: true,
    lowConfidence: true,
    complaints: true,
    highValue: true,
    keywords: DEFAULT_KEYWORDS,
  },
  autoLinks: {
    storefrontUrl: '',
    paymentLink: '',
    productLinks: [],
  },
  responseSettings: {
    responseDelaySeconds: 2,
    maxAiRepliesBeforeEscalation: 8,
    businessHours: {
      enabled: false,
      start: '09:00',
      end: '18:00',
      timezone: 'Africa/Lagos',
    },
  },
};

@Component({
  selector: 'app-automation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  templateUrl: './automation.component.html',
  styleUrls: ['./automation.component.scss'],
  providers: [AiAssistantService],
})
export class AutomationComponent {
  private aiService = inject(AiAssistantService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  readonly settings = signal<AutomationSettings>(this.cloneDefaults());
  readonly originalSettings = signal<AutomationSettings>(this.cloneDefaults());
  readonly keywordText = signal(DEFAULT_KEYWORDS.join(', '));
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly hasChanges = computed(() =>
    JSON.stringify(this.settings()) !== JSON.stringify(this.originalSettings())
  );
  readonly sampleReply = computed(() => {
    const settings = this.settings();

    if (settings.language === 'pidgin') {
      return settings.tone === 'sales'
        ? 'Available o. Delivery dey too. You wan order now?'
        : 'Yes, e dey available. I fit help you order am.';
    }

    if (settings.tone === 'professional') {
      return 'Yes, it is available. Would you like me to help you place an order?';
    }

    if (settings.tone === 'sales') {
      return 'Yes, it is available. I can send the order link now so you can pay quickly.';
    }

    return 'Yes, it is available. Would you like to place an order?';
  });

  constructor() {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading.set(true);
    this.aiService.getSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const mergedSettings = this.mergeSettings(res.data || {});
          this.settings.set(mergedSettings);
          this.originalSettings.set(this.cloneSettings(mergedSettings));
          this.keywordText.set(mergedSettings.escalationRules.keywords.join(', '));
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Failed to load automation settings', 'Close', { duration: 5000 });
        },
      });
  }

  updateAiEnabled(aiEnabled: boolean): void {
    this.patchSettings(settings => ({ ...settings, aiEnabled }));
  }

  saveSettings(): void {
    const payload = this.cloneSettings(this.settings());
    this.saving.set(true);

    this.aiService.updateSettings(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const savedSettings = this.mergeSettings(res.data || payload);
          this.settings.set(savedSettings);
          this.originalSettings.set(this.cloneSettings(savedSettings));
          this.keywordText.set(savedSettings.escalationRules.keywords.join(', '));
          this.saving.set(false);
          this.snackBar.open('Automation settings saved', 'Close', { duration: 3000 });
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Failed to save automation settings', 'Close', { duration: 5000 });
        },
      });
  }

  resetSettings(): void {
    const resetSettings = this.cloneSettings(this.originalSettings());
    this.settings.set(resetSettings);
    this.keywordText.set(resetSettings.escalationRules.keywords.join(', '));
  }

  addProductLink(): void {
    this.patchSettings(settings => ({
      ...settings,
      autoLinks: {
        ...settings.autoLinks,
        productLinks: [...settings.autoLinks.productLinks, { label: '', url: '' }],
      },
    }));
  }

  removeProductLink(index: number): void {
    this.patchSettings(settings => ({
      ...settings,
      autoLinks: {
        ...settings.autoLinks,
        productLinks: settings.autoLinks.productLinks.filter((_, itemIndex) => itemIndex !== index),
      },
    }));
  }

  updateTone(tone: AutomationSettings['tone']): void {
    this.patchSettings(settings => ({ ...settings, tone }));
  }

  updateLanguage(language: AutomationSettings['language']): void {
    this.patchSettings(settings => ({ ...settings, language }));
  }

  updateEscalationRule(
    key: keyof AutomationSettings['escalationRules'],
    value: boolean
  ): void {
    this.patchSettings(settings => ({
      ...settings,
      escalationRules: {
        ...settings.escalationRules,
        [key]: value,
      },
    }));
  }

  updateKeywordText(value: string): void {
    this.keywordText.set(value);
    this.patchSettings(settings => ({
      ...settings,
      escalationRules: {
        ...settings.escalationRules,
        keywords: this.parseKeywords(value),
      },
    }));
  }

  updateStorefrontUrl(value: string): void {
    this.patchSettings(settings => ({
      ...settings,
      autoLinks: {
        ...settings.autoLinks,
        storefrontUrl: value,
      },
    }));
  }

  updatePaymentLink(value: string): void {
    this.patchSettings(settings => ({
      ...settings,
      autoLinks: {
        ...settings.autoLinks,
        paymentLink: value,
      },
    }));
  }

  updateProductLink(index: number, field: keyof ProductLink, value: string): void {
    this.patchSettings(settings => ({
      ...settings,
      autoLinks: {
        ...settings.autoLinks,
        productLinks: settings.autoLinks.productLinks.map((link, itemIndex) =>
          itemIndex === index ? { ...link, [field]: value } : link
        ),
      },
    }));
  }

  updateResponseDelaySeconds(value: number | string): void {
    const responseDelaySeconds = this.toNumber(value, 0);
    this.patchSettings(settings => ({
      ...settings,
      responseSettings: {
        ...settings.responseSettings,
        responseDelaySeconds,
      },
    }));
  }

  updateMaxAiRepliesBeforeEscalation(value: number | string): void {
    const maxAiRepliesBeforeEscalation = this.toNumber(value, 1);
    this.patchSettings(settings => ({
      ...settings,
      responseSettings: {
        ...settings.responseSettings,
        maxAiRepliesBeforeEscalation,
      },
    }));
  }

  updateBusinessHoursEnabled(enabled: boolean): void {
    this.patchSettings(settings => ({
      ...settings,
      responseSettings: {
        ...settings.responseSettings,
        businessHours: {
          ...settings.responseSettings.businessHours,
          enabled,
        },
      },
    }));
  }

  updateBusinessHoursTime(field: 'start' | 'end', value: string): void {
    this.patchSettings(settings => ({
      ...settings,
      responseSettings: {
        ...settings.responseSettings,
        businessHours: {
          ...settings.responseSettings.businessHours,
          [field]: value,
        },
      },
    }));
  }

  updateBusinessHoursTimezone(value: string): void {
    this.patchSettings(settings => ({
      ...settings,
      responseSettings: {
        ...settings.responseSettings,
        businessHours: {
          ...settings.responseSettings.businessHours,
          timezone: value,
        },
      },
    }));
  }

  trackProductLink(index: number): number {
    return index;
  }

  private patchSettings(updater: (settings: AutomationSettings) => AutomationSettings): void {
    this.settings.update(settings => updater(this.cloneSettings(settings)));
  }

  private parseKeywords(value: string): string[] {
    return value
      .split(',')
      .map(keyword => keyword.trim())
      .filter(Boolean);
  }

  private toNumber(value: number | string, fallback: number): number {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  }

  private mergeSettings(data: any): AutomationSettings {
    const defaults = this.cloneDefaults();
    return {
      aiEnabled: data.aiEnabled ?? defaults.aiEnabled,
      tone: data.tone || defaults.tone,
      language: data.language || defaults.language,
      escalationRules: {
        ...defaults.escalationRules,
        ...(data.escalationRules || {}),
        keywords: data.escalationRules?.keywords?.length ? data.escalationRules.keywords : defaults.escalationRules.keywords,
      },
      autoLinks: {
        ...defaults.autoLinks,
        ...(data.autoLinks || {}),
        productLinks: data.autoLinks?.productLinks?.length ? data.autoLinks.productLinks : [],
      },
      responseSettings: {
        ...defaults.responseSettings,
        ...(data.responseSettings || {}),
        businessHours: {
          ...defaults.responseSettings.businessHours,
          ...(data.responseSettings?.businessHours || {}),
        },
      },
    };
  }

  private cloneDefaults(): AutomationSettings {
    return this.cloneSettings(DEFAULT_SETTINGS);
  }

  private cloneSettings(settings: AutomationSettings): AutomationSettings {
    return JSON.parse(JSON.stringify(settings));
  }
}
