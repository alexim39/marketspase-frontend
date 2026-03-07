import { Component, DestroyRef, effect, inject, Input, Signal, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { UserInterface } from '../../../../../../shared-services/src/public-api';
import { SettingsService, ThemeInterface } from '../system.service';
import { AppThemeService } from '../../../app-theme.service';

@Component({
  selector: 'async-theme-settings',
  templateUrl: './theme.component.html',
  styleUrls: ['./theme.component.scss'],
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, MatIconModule, MatCardModule],
  providers: [SettingsService],
})
export class ThemeSettingsComponent {
  @Input({ required: true }) user!: Signal<UserInterface | null>;

  // UI state signals
  isDarkMode: WritableSignal<boolean> = signal(false);
  highContrastMode: WritableSignal<boolean> = signal(false);
  systemDefault: WritableSignal<boolean> = signal(false); // initially assume not following system until we load user prefs
  systemTheme: WritableSignal<'light' | 'dark'> = signal('light');

  private readonly snackBar = inject(MatSnackBar);
  private readonly settingsService = inject(SettingsService);
  private readonly theme = inject(AppThemeService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // For display only (what the OS is set to)
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemTheme.set(mq.matches ? 'dark' : 'light');
      const onChange = (ev: MediaQueryListEvent) => this.systemTheme.set(ev.matches ? 'dark' : 'light');
      if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onChange);
      else (mq as any).addListener?.(onChange);
    }

    // React when user object (with preferences) arrives/changes
    effect(() => {
      const userPrefs = this.user()?.preferences;
      if (!userPrefs?.theme) return;

      // Load UI state from backend model
      const system = userPrefs.theme.systemDefault ?? true;
      const dark = !!userPrefs.theme.darkMode;
      const highContrast = !!userPrefs.theme.highContrast;

      this.systemDefault.set(system);
      this.isDarkMode.set(dark);
      this.highContrastMode.set(highContrast);

      // Apply globally via service
      if (system) {
        this.theme.followSystemTheme();
      } else {
        this.theme.set(dark ? 'dark' : 'light');
      }

      // Apply high-contrast + meta color
      this.applyHighContrastAndMeta();
    });
  }

  // ------- User interactions -------

  toggleTheme(event: any): void {
    // User is making an explicit choice → stop following system
    const isDark = !!event.checked;
    this.applyAndPersist({ systemDefault: false, darkMode: isDark, highContrast: this.highContrastMode() });
  }

  setLightTheme(): void {
    this.applyAndPersist({ systemDefault: false, darkMode: false, highContrast: this.highContrastMode() });
  }

  setDarkTheme(): void {
    this.applyAndPersist({ systemDefault: false, darkMode: true, highContrast: this.highContrastMode() });
  }

  toggleHighContrast(event: any): void {
    const hc = !!event.checked;
    this.applyAndPersist({ systemDefault: this.systemDefault(), darkMode: this.isDarkMode(), highContrast: hc });
  }

  toggleSystemDefault(event: any): void {
    const useSystem = !!event.checked;
    // When switching to system, the effective theme should match the OS right away
    const darkFromOS = this.systemTheme() === 'dark';
    const nextDark = useSystem ? darkFromOS : this.isDarkMode(); // keep prior choice when leaving system

    this.applyAndPersist({ systemDefault: useSystem, darkMode: nextDark, highContrast: this.highContrastMode() });
  }

  // ------- Internals -------

  /**
   * Apply locally (service + DOM) first for instant UX,
   * then persist to backend; on error, revert everything.
   */
  private applyAndPersist(next: { systemDefault: boolean; darkMode: boolean; highContrast: boolean }) {
    const userId = this.user()?._id;
    if (!userId) {
      this.snackBar.open('User not authenticated', 'Ok', { duration: 3000 });
      return;
    }

    // Capture previous state for safe rollback on error
    const prev = {
      systemDefault: this.systemDefault(),
      darkMode: this.isDarkMode(),
      highContrast: this.highContrastMode(),
      serviceFollowing: this.theme.isFollowingSystem,
      serviceCurrent: this.theme.current,
    };

    // 1) Apply immediately (service + UI signals)
    this.systemDefault.set(next.systemDefault);
    this.isDarkMode.set(next.darkMode);
    this.highContrastMode.set(next.highContrast);

    if (next.systemDefault) {
      this.theme.followSystemTheme();
    } else {
      this.theme.set(next.darkMode ? 'dark' : 'light');
    }
    this.applyHighContrastAndMeta();

    // 2) Persist to backend
    const payload: ThemeInterface = {
      userId,
      systemDefault: next.systemDefault,
      darkMode: next.darkMode,
      highContrast: next.highContrast,
    };

    this.settingsService.updateTheme(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          //console.log('Theme updated successfully', res);
          this.snackBar.open(res?.message || 'Theme preferences updated successfully', 'Ok', { duration: 2500 });
        },
        error: (err: any) => {
          // Rollback signals
          this.systemDefault.set(prev.systemDefault);
          this.isDarkMode.set(prev.darkMode);
          this.highContrastMode.set(prev.highContrast);

          // Rollback service
          if (prev.serviceFollowing) this.theme.followSystemTheme();
          else this.theme.set(prev.serviceCurrent);

          this.applyHighContrastAndMeta();

          const msg = err?.error?.message || 'Failed to update theme preferences. Please try again.';
          this.snackBar.open(msg, 'Ok', { duration: 5000 });
        }
      });
  }

  /** High-contrast class + <meta name="theme-color"> update */
  private applyHighContrastAndMeta(): void {
    if (typeof document === 'undefined') return;
    const body = document.body;
    const html = document.documentElement;

    body.classList.toggle('high-contrast', this.highContrastMode());
    html.classList.toggle('high-contrast', this.highContrastMode());

    const effectiveDark = this.theme.current === 'dark';
    const color = effectiveDark ? '#1a1a1a' : '#ffffff';

    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', color);
  }
}