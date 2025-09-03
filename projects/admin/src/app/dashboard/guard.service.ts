import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const AuthGuard = () => {
  const router = inject(Router);
  const isLoggedIn = !!localStorage.getItem('isAuthenticated'); // Check user login status

  if (!isLoggedIn) {
    router.navigate(['/']); // Redirect to login page if not logged in
    return false;
  }
  return true;
};
