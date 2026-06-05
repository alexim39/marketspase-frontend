import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router'; // Import CanActivateFn and UrlTree for functional guards
import { Auth, authState } from '@angular/fire/auth'; // Import Auth service and authState observable
import { map, take, tap } from 'rxjs/operators';

/**
 * An Angular functional AuthGuard that accepts either Firebase or local JWT sessions.
 *
 * If no valid client-side auth marker exists, it redirects users to the root login page.
 *
 * @returns An Observable that emits true if the user is authenticated, otherwise navigates and completes.
 */
export const AuthGuard: CanActivateFn = () => { // Define as a CanActivateFn for modern Angular
  const router = inject(Router);
  const auth = inject(Auth); // Inject the Firebase Auth service
  const hasLocalSession = () => {
    try {
      return Boolean(localStorage.getItem('accessToken') || localStorage.getItem('token'));
    } catch {
      return false;
    }
  };

  // authState(auth) returns an Observable<User | null>; local email login uses the backend JWT.
  return authState(auth).pipe(
    take(1),
    map(user => {
      return !!user || hasLocalSession();
    }),
    tap(isLoggedIn => {
      if (!isLoggedIn) {
        router.navigate(['/']);
      }
    })
  );
};
