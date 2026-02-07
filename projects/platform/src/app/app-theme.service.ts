import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'theme';                       // 'light' | 'dark'
const FOLLOW_SYSTEM_KEY = 'theme:follow-system'; // 'true' | 'false'

@Injectable({ providedIn: 'root' })
export class AppThemeService {
  private readonly isBrowser: boolean;
  private followSystem = false;   // ✅ default: do NOT follow system unless explicitly stored
  private mq: MediaQueryList | null = null;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (!this.isBrowser) return; // SSR-safe: skip DOM/storage work

    // Restore "follow system" flag (only true when explicitly stored as 'true')
    const followStored = this.safeGet(FOLLOW_SYSTEM_KEY);
    this.followSystem = (followStored === 'true');

    // Determine initial theme:
    // 1) If user has explicit theme stored, use it and stop following system.
    // 2) Otherwise, if following system is enabled, compute from OS.
    // 3) Otherwise fall back to system computation once (but keep followSystem=false).
    const storedTheme = this.safeGet(THEME_KEY) as ThemeMode | null;

    let initial: ThemeMode;
    if (storedTheme === 'light' || storedTheme === 'dark') {
      // Explicit user choice wins; make sure we are not following system
      this.followSystem = false;
      initial = storedTheme;
    } else if (this.followSystem) {
      initial = this.computeSystemTheme();
    } else {
      initial = this.computeSystemTheme(); // visual default, but we are NOT following system
    }

    // Apply immediately (before first paint when used with provideAppInitializer)
    this.applyTheme(initial);

    // Listen for OS changes only when following system
    this.bindSystemListener();
  }

  /** Current effective theme ('light' | 'dark') */
  get current(): ThemeMode {
    if (!this.isBrowser) return 'light';
    return (document.body.getAttribute('data-theme') === 'dark') ? 'dark' : 'light';
  }

  /** Whether we are currently following the OS theme */
  get isFollowingSystem(): boolean {
    return this.followSystem;
  }

  /** Explicit user choice; persists and stops following system */
  set(theme: ThemeMode): void {
    if (!this.isBrowser) return;
    this.followSystem = false;
    this.safeSet(FOLLOW_SYSTEM_KEY, 'false');
    this.safeSet(THEME_KEY, theme);
    this.applyTheme(theme);
  }

  /** Revert to following OS theme; removes explicit user theme */
  followSystemTheme(): void {
    if (!this.isBrowser) return;
    this.followSystem = true;
    this.safeSet(FOLLOW_SYSTEM_KEY, 'true');
    this.safeRemove(THEME_KEY);
    this.applyTheme(this.computeSystemTheme());
  }

  /** Read current OS preference (without changing state) */
  getSystemTheme(): ThemeMode {
    return this.computeSystemTheme();
  }

  // ---------------- Internals ----------------

  private bindSystemListener(): void {
    if (!this.isBrowser || !('matchMedia' in window)) return;
    this.mq = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = () => {
      // React to OS changes only when following system
      if (this.followSystem && this.mq) {
        this.applyTheme(this.mq.matches ? 'dark' : 'light');
      }
    };

    if (typeof this.mq.addEventListener === 'function') {
      this.mq.addEventListener('change', handler);
    } else {
      // Safari < 14
      (this.mq as any).addListener?.(handler);
    }
  }

  private applyTheme(theme: ThemeMode): void {
    if (!this.isBrowser) return;
    document.body.setAttribute('data-theme', theme);
    // Hint native UI (scrollbars/inputs) to match the theme
    document.documentElement.style.colorScheme = theme;
  }

  private computeSystemTheme(): ThemeMode {
    if (!this.isBrowser || !('matchMedia' in window)) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private safeGet(key: string): string | null {
    try { return this.isBrowser ? window.localStorage.getItem(key) : null; } catch { return null; }
  }
  private safeSet(key: string, value: string): void {
    try { if (this.isBrowser) window.localStorage.setItem(key, value); } catch {}
  }
  private safeRemove(key: string): void {
    try { if (this.isBrowser) window.localStorage.removeItem(key); } catch {}
  }
}
