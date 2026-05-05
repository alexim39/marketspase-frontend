import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AiAssistantService } from '../../services/ai-assistant.service';

@Component({
  selector: 'app-automation',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './automation.component.html',
  styleUrls: ['./automation.component.scss']
})
export class AutomationComponent implements OnInit, OnDestroy {
  private aiService = inject(AiAssistantService);
  private snackBar = inject(MatSnackBar);

  private destroy$ = new Subject<void>();

  settings: any = { 
    tone: 'friendly', 
    language: 'english', 
    aiEnabled: false,
    escalationKeywords: 'human, agent, speak to someone, help, real person, manager, supervisor',
    autoLink: ''
  };
  
  originalSettings: any = {};
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
          const data = res.data || {};
          this.settings = {
            tone: data.tone || 'friendly',
            language: data.language || 'english',
            aiEnabled: data.aiEnabled ?? false,
            escalationKeywords: data.escalationKeywords || 'human, agent, speak to someone, help, real person, manager, supervisor',
            autoLink: data.autoLink || ''
          };
          this.originalSettings = { ...this.settings };
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Failed to load settings', 'Close', { duration: 5000 });
        }
      });
  }

  onChange(): void {
    this.hasChanges = JSON.stringify(this.settings) !== JSON.stringify(this.originalSettings);
  }

  saveSettings(): void {
    this.saving = true;
    const data = {
      tone: this.settings.tone,
      language: this.settings.language,
      aiEnabled: this.settings.aiEnabled,
      escalationKeywords: this.settings.escalationKeywords,
      autoLink: this.settings.autoLink
    };
    
    this.aiService.updateSettings(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.originalSettings = { ...this.settings };
          this.hasChanges = false;
          this.saving = false;
          this.snackBar.open('Automation settings saved', 'Close', { duration: 3000 });
        },
        error: () => {
          this.saving = false;
          this.snackBar.open('Failed to save settings', 'Close', { duration: 5000 });
        }
      });
  }

  resetSettings(): void {
    this.settings = { ...this.originalSettings };
    this.hasChanges = false;
  }
}