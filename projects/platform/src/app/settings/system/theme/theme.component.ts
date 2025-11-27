// theme.component.ts
import { Component, DestroyRef, effect, inject, Input, Signal, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserInterface } from '../../../../../../shared-services/src/public-api';
import { SettingsService, ThemeInterface } from '../system.service';

@Component({
  selector: 'async-theme-settings',
  template: `
  <div class="theme-settings">
    <h3 class="section-title">Theme Preferences</h3>
    <p class="section-description">Customize your visual experience with light or dark mode</p>

    <mat-card class="setting-card">
      <!-- Theme Mode Selection -->
      <div class="setting-row">
        <div class="setting-info">
          <mat-icon>palette</mat-icon>
          <div>
            <h4>Theme Mode</h4>
            <p>Choose between light and dark theme for the application</p>
          </div>
        </div>
        <div class="theme-toggle-container">
          <mat-slide-toggle
            [checked]="isDarkMode()"
            (change)="toggleTheme($event)"
            [disabled]="systemDefault()"
            color="primary">
            {{ isDarkMode() ? 'Light' : 'Dark' }}
          </mat-slide-toggle>
        </div>
      </div>

      <!-- Theme Preview Section -->
      <div class="theme-preview-section">
        <h5>Theme Preview</h5>
        <div class="theme-previews">
          <div 
            class="theme-preview light-theme" 
            [class.active]="!isDarkMode() && !systemDefault()"
            [class.disabled]="systemDefault()"
            (click)="!systemDefault() && setLightTheme()">
            <div class="preview-header">
              <div class="preview-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div class="preview-content">
              <div class="preview-card"></div>
              <div class="preview-text">
                <div class="text-line short"></div>
                <div class="text-line medium"></div>
              </div>
            </div>
            <div class="theme-label">
              <mat-icon>light_mode</mat-icon>
              <span>Light</span>
              <span class="badge" *ngIf="systemDefault() && !isDarkMode()">System</span>
            </div>
          </div>

          <div 
            class="theme-preview dark-theme" 
            [class.active]="isDarkMode() && !systemDefault()"
            [class.disabled]="systemDefault()"
            (click)="!systemDefault() && setDarkTheme()">
            <div class="preview-header">
              <div class="preview-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div class="preview-content">
              <div class="preview-card"></div>
              <div class="preview-text">
                <div class="text-line short"></div>
                <div class="text-line medium"></div>
              </div>
            </div>
            <div class="theme-label">
              <mat-icon>dark_mode</mat-icon>
              <span>Dark</span>
              <span class="badge" *ngIf="systemDefault() && isDarkMode()">System</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Theme Options -->
      <div class="additional-options">
        <h5>Additional Options</h5>
        <div class="option-list">
          <div class="option-item">
            <div class="option-info">
              <mat-icon>auto_mode</mat-icon>
              <div>
                <h6>System Default</h6>
                <p>Automatically match your system theme</p>
                <small class="option-note" *ngIf="systemDefault()">
                  Using system theme: {{ systemTheme() }}
                </small>
              </div>
            </div>
            <mat-slide-toggle
              [checked]="systemDefault()"
              (change)="toggleSystemDefault($event)"
              color="primary">
            </mat-slide-toggle>
          </div>

          <div class="option-item">
            <div class="option-info">
              <mat-icon>contrast</mat-icon>
              <div>
                <h6>High Contrast Mode</h6>
                <p>Increase contrast for better readability</p>
              </div>
            </div>
            <mat-slide-toggle
              [checked]="highContrastMode()"
              (change)="toggleHighContrast($event)"
              color="primary">
            </mat-slide-toggle>
          </div>
        </div>
      </div>
    </mat-card>
  </div>
  `,
  styleUrls: ['./theme.component.scss'],
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, MatIconModule, MatCardModule],
  providers: [SettingsService],
})
export class ThemeSettingsComponent {
  @Input({ required: true }) user!: Signal<UserInterface | null>;

  isDarkMode: WritableSignal<boolean> = signal(false);
  highContrastMode: WritableSignal<boolean> = signal(false);
  systemDefault: WritableSignal<boolean> = signal(true);
  systemTheme: WritableSignal<string> = signal('light');

  private readonly snackBar = inject(MatSnackBar);
  private readonly settingsService = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.detectSystemTheme();
    this.setupThemeListeners();

    effect(() => {
      console.log('User preferences changed, updating theme settings...', this.user());
      const userPrefs = this.user()?.preferences;
      if (userPrefs?.theme) {
        this.isDarkMode.set(userPrefs.theme.darkMode || false);
        this.highContrastMode.set(userPrefs.theme.highContrast || false);
        this.systemDefault.set(userPrefs.theme.systemDefault ?? true);
        
        // Apply theme immediately when user preferences are loaded
        this.applyThemeGlobally();
      }
    });
  }

  private detectSystemTheme(): void {
    // Check if window is defined (for SSR compatibility)
    if (typeof window !== 'undefined' && window.matchMedia) {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemTheme.set(darkModeMediaQuery.matches ? 'dark' : 'light');
      this.isDarkMode.set(darkModeMediaQuery.matches);
    }
  }

  private setupThemeListeners(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = (event: MediaQueryListEvent) => {
        this.systemTheme.set(event.matches ? 'dark' : 'light');
        if (this.systemDefault()) {
          this.isDarkMode.set(event.matches);
          this.applyThemeGlobally();
        }
      };

      // Modern browsers
      if (darkModeMediaQuery.addEventListener) {
        darkModeMediaQuery.addEventListener('change', handleSystemThemeChange);
      } 
      // Legacy browsers
      else if (darkModeMediaQuery.addListener) {
        darkModeMediaQuery.addListener(handleSystemThemeChange);
      }
    }
  }

  toggleTheme(event: any): void {
    const isDark = event.checked;
    this.isDarkMode.set(isDark);
    this.updateThemePreferences();
  }

  setLightTheme(): void {
    this.isDarkMode.set(false);
    this.updateThemePreferences();
  }

  setDarkTheme(): void {
    this.isDarkMode.set(true);
    this.updateThemePreferences();
  }

  toggleHighContrast(event: any): void {
    this.highContrastMode.set(event.checked);
    this.updateThemePreferences();
  }

  toggleSystemDefault(event: any): void {
    const useSystemDefault = event.checked;
    this.systemDefault.set(useSystemDefault);
    
    if (useSystemDefault) {
      // Use system theme when system default is enabled
      this.isDarkMode.set(this.systemTheme() === 'dark');
    }
    
    this.updateThemePreferences();
  }

  private updateThemePreferences(): void {
    const userId = this.user()?._id;
    if (!userId) {
      console.error('User ID not available');
      this.snackBar.open('User not authenticated', 'Ok', { duration: 3000 });
      return;
    }

    const themeObject: ThemeInterface = {
      darkMode: this.isDarkMode(),
      highContrast: this.highContrastMode(),
      systemDefault: this.systemDefault(),
      userId: userId
    };

    this.settingsService.updateTheme(themeObject)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.snackBar.open(response.message || 'Theme preferences updated successfully', 'Ok', { duration: 3000 });
          this.applyThemeGlobally();
        },
        error: (error: any) => {
          console.error('Failed to update theme preferences:', error);
          
          // Revert changes on error
          this.isDarkMode.set(!this.isDarkMode());
          this.highContrastMode.set(!this.highContrastMode());
          this.systemDefault.set(!this.systemDefault());
          
          const errorMessage = error.error?.message || 'Failed to update theme preferences. Please try again.';
          this.snackBar.open(errorMessage, 'Ok', { duration: 5000 });
        }
      });
  }

  // private applyThemeGlobally(): void {
  //   if (typeof document === 'undefined') return; // SSR compatibility

  //   const body = document.body;
  //   const html = document.documentElement;
    
  //   // Remove all theme classes first
  //   body.classList.remove('light-theme', 'dark-theme', 'high-contrast');
  //   html.classList.remove('light-theme', 'dark-theme', 'high-contrast');
    
  //   // Determine which theme to apply
  //   const effectiveDarkMode = this.systemDefault() ? this.systemTheme() === 'dark' : this.isDarkMode();
    
  //   if (effectiveDarkMode) {
  //     body.classList.add('dark-theme');
  //     html.classList.add('dark-theme');
  //   } else {
  //     body.classList.add('light-theme');
  //     html.classList.add('light-theme');
  //   }

  //   if (this.highContrastMode()) {
  //     body.classList.add('high-contrast');
  //     html.classList.add('high-contrast');
  //   }

  //   // Update meta theme-color for mobile browsers
  //   this.updateThemeColorMeta();
  // }


  private applyThemeGlobally(): void {
    if (typeof document === 'undefined') return;

    const body = document.body;
    const html = document.documentElement;
    
    // 1. Theme Mode (data-attribute)
    const effectiveDarkMode = this.systemDefault() ? this.systemTheme() === 'dark' : this.isDarkMode();
    
    if (effectiveDarkMode) {
      body.setAttribute('data-theme', 'dark'); // <-- SET ATTRIBUTE
    } else {
      // It's important to remove the attribute or set it to 'light'
      body.setAttribute('data-theme', 'light'); // <-- SET ATTRIBUTE
    }

    // 2. High Contrast Mode (Class is fine here)
    body.classList.toggle('high-contrast', this.highContrastMode());
    html.classList.toggle('high-contrast', this.highContrastMode());
    
    // You might also need to update the color-scheme
    html.style.colorScheme = effectiveDarkMode ? 'dark' : 'light';
    
    // Update meta theme-color for mobile browsers
    this.updateThemeColorMeta();
  }

  private updateThemeColorMeta(): void {
    if (typeof document === 'undefined') return;

    let themeColor = '#ffffff'; // Default light theme color
    if (this.systemDefault() && this.systemTheme() === 'dark') {
      themeColor = '#1a1a1a';
    } else if (!this.systemDefault() && this.isDarkMode()) {
      themeColor = '#1a1a1a';
    }

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', themeColor);
  }
}