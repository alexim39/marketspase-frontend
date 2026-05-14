import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);

  if (req.headers.has('Authorization')) {
    return next(req);
  }

  const legacyToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
  const authStateReady = (auth as Auth & { authStateReady?: () => Promise<void> }).authStateReady?.() ?? Promise.resolve();

  return from(authStateReady).pipe(
    switchMap(() => {
      if (legacyToken) {
        return of(legacyToken);
      }

      return auth.currentUser ? from(auth.currentUser.getIdToken()) : of(null);
    }),
    switchMap((token) => {
      if (!token) {
        return next(req);
      }

      return next(req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      }));
    })
  );
};
