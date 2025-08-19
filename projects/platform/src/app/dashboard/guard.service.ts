import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router'; // Import CanActivateFn and UrlTree for functional guards
import { Auth, authState } from '@angular/fire/auth'; // Import Auth service and authState observable
import { map, tap } from 'rxjs/operators';

/**
 * An Angular functional AuthGuard that checks Firebase Authentication status.
 *
 * If the user is not logged in (Firebase User is null), it redirects them to the root ('/') path.
 *
 * @returns An Observable that emits true if the user is authenticated, otherwise navigates and completes.
 */
export const AuthGuard: CanActivateFn = () => { // Define as a CanActivateFn for modern Angular
  const router = inject(Router);
  const auth = inject(Auth); // Inject the Firebase Auth service

  // authState(auth) returns an Observable<User | null>
  return authState(auth).pipe(
    map(user => {
      // If 'user' object exists, they are logged in (map to true)
      // If 'user' is null, they are not logged in (map to false)
      return !!user;
    }),
    tap(isLoggedIn => {
      // 'tap' is used for side effects, like navigation, without altering the stream
      if (!isLoggedIn) {
        // If not logged in, navigate to the root (login) page
        router.navigate(['/']);
      }
    })
    // The guard will automatically complete after the first emission
    // (which is usually sufficient for route activation)
  );
};
