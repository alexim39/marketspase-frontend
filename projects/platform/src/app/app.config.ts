// src/app/app.config.ts
import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';

// Firebase
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideMessaging, getMessaging } from '@angular/fire/messaging';
import { firebaseConfig } from './firebase.config';
import { authInterceptor } from './common/interceptors/auth.interceptor';

// Theme service
import { AppThemeService } from './app-theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideNativeDateAdapter(),

    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideMessaging(() => getMessaging()),
    provideAnimationsAsync(),

    AppThemeService,
    provideAppInitializer(() => {
      // Force early instantiation; constructor applies theme immediately
      inject(AppThemeService);
    }),
  ],
};
