// settings-panel.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AiSettings } from '../../models/assistant.model';
import { AiAssistantService } from '../../services/ai-assistant.service';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatSelectModule],
  template: `
    <mat-card class="settings-card">
      <h3>AI Settings</h3>
      <form [formGroup]="settingsForm" class="settings-form">
        <mat-form-field appearance="outline">
          <mat-label>Tone</mat-label>
          <mat-select formControlName="tone">
            <mat-option value="friendly">Friendly</mat-option>
            <mat-option value="professional">Professional</mat-option>
            <mat-option value="sales">Sales</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Language</mat-label>
          <mat-select formControlName="language">
            <mat-option value="english">English</mat-option>
            <mat-option value="pidgin">Pidgin</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-card>
  `,
  styles: [`
    .settings-card {
      background: var(--surface-color);
    }
    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 12px;
    }
  `]
})
export class SettingsPanelComponent {
  @Input() set settings(settings: AiSettings | null) {
    if (settings) {
      this.settingsForm.patchValue(settings, { emitEvent: false });
    }
  }

  // Declare without initializing immediately
  settingsForm!: FormGroup; 

  constructor(private fb: FormBuilder, private service: AiAssistantService) {
    // Initialize here
    this.settingsForm = this.fb.group({
      tone: ['friendly'],
      language: ['english'],
    });

    this.settingsForm.valueChanges.subscribe(value => {
      this.service.updateSettings(value as Partial<AiSettings>);
    });
  }
}
