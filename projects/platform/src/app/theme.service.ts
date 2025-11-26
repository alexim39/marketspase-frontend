import { Injectable, signal, effect, Inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Signal to hold the current theme state (easier to use in templates than Observables)
  currentTheme = signal<Theme>('light');

  private readonly storageKey = 'user-theme-preference';

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Only execute this logic if we are in the browser (avoids SSR errors)
    if (isPlatformBrowser(this.platformId)) {
      this.initTheme();
      
      // OPTIONAL: Listen for system preference changes (OS level)
      // If user hasn't manually set a preference, we can auto-switch
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        const savedTheme = localStorage.getItem(this.storageKey);
        if (!savedTheme) {
          this.setTheme(e.matches ? 'dark' : 'light', false);
        }
      });
    }
  }

  /**
   * Toggles between light and dark themes
   */
  toggleTheme(): void {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme, true);
  }

  /**
   * Sets the theme explicitly
   * @param theme 'light' | 'dark'
   * @param saveToStorage Whether to persist to localStorage (default true)
   */
  private setTheme(theme: Theme, saveToStorage: boolean = true): void {
    this.currentTheme.set(theme);

    // Update the DOM
    if (theme === 'dark') {
      this.document.body.setAttribute('data-theme', 'dark');
      this.document.body.classList.add('dark-theme'); // Optional: Add class for utility libraries like Tailwind
    } else {
      this.document.body.removeAttribute('data-theme');
      this.document.body.classList.remove('dark-theme');
    }

    // Save to storage
    if (saveToStorage) {
      localStorage.setItem(this.storageKey, theme);
    }
  }

  /**
   * Initialize theme based on:
   * 1. LocalStorage (User preference)
   * 2. System Preference (OS Settings)
   * 3. Default to Light
   */
  private initTheme(): void {
    const savedTheme = localStorage.getItem(this.storageKey) as Theme;

    if (savedTheme) {
      // 1. Load saved user preference
      this.setTheme(savedTheme, false); // Don't re-save what we just read
    } else {
      // 2. Check system preference
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(systemDark ? 'dark' : 'light', false);
    }
  }
}