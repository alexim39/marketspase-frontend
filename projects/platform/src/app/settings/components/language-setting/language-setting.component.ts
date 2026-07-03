import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { LocaleService, LocaleCode } from '../../../common/i18n/locale.service';

@Component({
  selector: 'app-language-setting',
  standalone: true,
  imports: [CommonModule, MatRadioModule, MatCardModule],
  template: `
    <mat-card class="setting-card">
      <mat-card-header><mat-card-title>Language</mat-card-title></mat-card-header>
      <mat-card-content>
        <mat-radio-group [value]="locale.currentLocale()" (change)="locale.setLocale($event.value)">
          <mat-radio-button value="en">🇬🇧 English</mat-radio-button>
          <mat-radio-button value="fr">🇫🇷 Français</mat-radio-button>
          <mat-radio-button value="ha">🇳🇬 Hausa</mat-radio-button>
          <mat-radio-button value="yo">🇳🇬 Yorùbá</mat-radio-button>
        </mat-radio-group>
      </mat-card-content>
    </mat-card>
  `,
})
export class LanguageSettingComponent {
  readonly locale = inject(LocaleService);
}
