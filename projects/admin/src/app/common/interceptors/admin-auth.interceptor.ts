import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

const shouldAttachCredentials = (url: string): boolean => {
  if (!/^https?:\/\//i.test(url)) {
    return true;
  }

  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'localhost'
      || parsed.hostname === '127.0.0.1'
      || parsed.hostname.endsWith('marketspase.com')
      || parsed.hostname.endsWith('b4a.run')
    );
  } catch {
    return false;
  }
};

export const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const shouldHandleAuthFailure = shouldAttachCredentials(req.url) && !req.url.includes('/auth/admin/signin');

  const request = (req.withCredentials || !shouldAttachCredentials(req.url))
    ? req
    : req.clone({ withCredentials: true });

  return next(request).pipe(
    catchError((error) => {
      if (shouldHandleAuthFailure && error?.status === 401) {
        localStorage.removeItem('isAuthenticated');
        router.navigateByUrl('/');
      }
      return throwError(() => error);
    })
  );
};
