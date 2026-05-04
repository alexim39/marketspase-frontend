import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, Injector, runInInjectionContext } from '@angular/core';

type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'theme';                       
const FOLLOW_SYSTEM_KEY = 'theme:follow-system'; 

@Injectable({ providedIn: 'root' })
export class AppThemeService {
  private readonly isBrowser: boolean;
  private followSystem = false;   
  private mq: MediaQueryList | null = null;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private injector: Injector 
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    if (!this.isBrowser) return;

    // We defer execution to the next tick. 
    // This ensures Angular has finished bootstrapping and the 
    // Injection Context is ready for any Material sub-modules.
    setTimeout(() => {
      runInInjectionContext(this.injector, () => {
        this.initializeTheme();
      });
    });
  }

  /** Logic moved out of constructor to be called in context */
  private initializeTheme(): void {
    const followStored = this.safeGet(FOLLOW_SYSTEM_KEY);
    this.followSystem = (followStored === 'true');

    const storedTheme = this.safeGet(THEME_KEY) as ThemeMode | null;

    let initial: ThemeMode;
    if (storedTheme === 'light' || storedTheme === 'dark') {
      this.followSystem = false;
      initial = storedTheme;
    } else {
      initial = this.computeSystemTheme();
    }

    this.applyTheme(initial);
    this.bindSystemListener();
  }

  get current(): ThemeMode {
    if (!this.isBrowser) return 'light';
    return (document.body.getAttribute('data-theme') === 'dark') ? 'dark' : 'light';
  }

  get isFollowingSystem(): boolean {
    return this.followSystem;
  }

  set(theme: ThemeMode): void {
    if (!this.isBrowser) return;
    this.followSystem = false;
    this.safeSet(FOLLOW_SYSTEM_KEY, 'false');
    this.safeSet(THEME_KEY, theme);
    this.applyTheme(theme);
  }

  followSystemTheme(): void {
    if (!this.isBrowser) return;
    this.followSystem = true;
    this.safeSet(FOLLOW_SYSTEM_KEY, 'true');
    this.safeRemove(THEME_KEY);
    this.applyTheme(this.computeSystemTheme());
  }

  getSystemTheme(): ThemeMode {
    return this.computeSystemTheme();
  }

  private bindSystemListener(): void {
    if (!this.isBrowser || !('matchMedia' in window)) return;
    this.mq = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = () => {
      if (this.followSystem && this.mq) {
        this.applyTheme(this.mq.matches ? 'dark' : 'light');
      }
    };

    if (typeof this.mq.addEventListener === 'function') {
      this.mq.addEventListener('change', handler);
    } else {
      (this.mq as any).addListener?.(handler);
    }
  }

  private applyTheme(theme: ThemeMode): void {
    if (!this.isBrowser) return;
    document.body.setAttribute('data-theme', theme);
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
