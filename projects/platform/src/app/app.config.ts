import { 
  ApplicationConfig, 
  provideBrowserGlobalErrorListeners, 
  provideZonelessChangeDetection 
} from '@angular/core';
import { provideRouter } from '@angular/router';
//import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
// Import Firebase and AngularFire modules
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { firebaseConfig } from './firebase.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // 1. Initialize and provide the Firebase App
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    //provideAnimationsAsync(),

    // 2. Initialize and provide the Firebase Authentication service
    provideAuth(() => getAuth()),
    
  ]
};
