import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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
import { Subject, takeUntil } from 'rxjs';
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
export class AutomationComponent implements OnInit, OnDestroy {
  private aiService = inject(AiAssistantService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  settings: AutomationSettings = this.cloneDefaults();
  originalSettings: AutomationSettings = this.cloneDefaults();
  keywordText = DEFAULT_KEYWORDS.join(', ');
  loading = false;
  saving = false;
  hasChanges = false;

  ngOnInit(): void {
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSettings(): void {
    this.loading = true;
    this.aiService.getSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.settings = this.mergeSettings(res.data || {});
          this.keywordText = this.settings.escalationRules.keywords.join(', ');
          this.originalSettings = this.cloneSettings(this.settings);
          this.hasChanges = false;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Failed to load automation settings', 'Close', { duration: 5000 });
        },
      });
  }

  onChange(): void {
    this.syncKeywordsFromText();
    this.hasChanges = JSON.stringify(this.settings) !== JSON.stringify(this.originalSettings);
  }

  saveSettings(): void {
    this.syncKeywordsFromText();
    this.saving = true;

    this.aiService.updateSettings(this.settings)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.settings = this.mergeSettings(res.data || this.settings);
          this.keywordText = this.settings.escalationRules.keywords.join(', ');
          this.originalSettings = this.cloneSettings(this.settings);
          this.hasChanges = false;
          this.saving = false;
          this.snackBar.open('Automation settings saved', 'Close', { duration: 3000 });
        },
        error: () => {
          this.saving = false;
          this.snackBar.open('Failed to save automation settings', 'Close', { duration: 5000 });
        },
      });
  }

  resetSettings(): void {
    this.settings = this.cloneSettings(this.originalSettings);
    this.keywordText = this.settings.escalationRules.keywords.join(', ');
    this.hasChanges = false;
  }

  addProductLink(): void {
    this.settings.autoLinks.productLinks.push({ label: '', url: '' });
    this.onChange();
  }

  removeProductLink(index: number): void {
    this.settings.autoLinks.productLinks.splice(index, 1);
    this.onChange();
  }

  get sampleReply(): string {
    if (this.settings.language === 'pidgin') {
      return this.settings.tone === 'sales'
        ? 'Available o. Delivery dey too. You wan order now?'
        : 'Yes, e dey available. I fit help you order am.';
    }

    if (this.settings.tone === 'professional') {
      return 'Yes, it is available. Would you like me to help you place an order?';
    }

    if (this.settings.tone === 'sales') {
      return 'Yes, it is available. I can send the order link now so you can pay quickly.';
    }

    return 'Yes, it is available. Would you like to place an order?';
  }

  private syncKeywordsFromText(): void {
    this.settings.escalationRules.keywords = this.keywordText
      .split(',')
      .map(keyword => keyword.trim())
      .filter(Boolean);
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
