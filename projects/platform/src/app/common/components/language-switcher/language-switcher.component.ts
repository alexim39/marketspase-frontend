import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { LocaleService, LocaleCode } from '../../i18n/locale.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatMenuModule, MatIconModule],
  template: `
    <button mat-button [matMenuTriggerFor]="langMenu" class="lang-btn">
      <mat-icon>translate</mat-icon>
      {{ labels[localeService.currentLocale()] }}
    </button>
    <mat-menu #langMenu="matMenu">
      @for (l of locales; track l.code) {
        <button mat-menu-item (click)="select(l.code)">
          <span>{{ l.flag }} {{ l.label }}</span>
          @if (l.code === localeService.currentLocale()) { <mat-icon class="check">check</mat-icon> }
        </button>
      }
    </mat-menu>
  `,
  styles: [`.lang-btn { font-weight: 600; } .check { margin-left: auto; color: var(--primary-color); }`],
})
export class LanguageSwitcherComponent {
  readonly localeService = inject(LocaleService);
  readonly labels: Record<string, string> = { en: 'EN', fr: 'FR', ha: 'HA', yo: 'YO' };
  readonly locales = [
    { code: 'en' as LocaleCode, label: 'English', flag: '🇬🇧' },
    { code: 'fr' as LocaleCode, label: 'Français', flag: '🇫🇷' },
    { code: 'ha' as LocaleCode, label: 'Hausa', flag: '🇳🇬' },
    { code: 'yo' as LocaleCode, label: 'Yorùbá', flag: '🇳🇬' },
  ];
  select(code: LocaleCode): void { this.localeService.setLocale(code); }
}
