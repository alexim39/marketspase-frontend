import { Injectable, inject } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  signInWithPopup,
  UserCredential,
  signOut,
  User, 
  user
} from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../common/services/user.service';


@Injectable({
  providedIn: 'root' // This makes the service a singleton
})
export class AuthService {
  // Inject the Firebase Auth instance
  private firebaseAuth: Auth = inject(Auth);
  private userService = inject(UserService);

  /**
   * Initiates the Google sign-in process using a popup.
   * Returns an Observable of the UserCredential or throws an HttpErrorResponse.
   */
  signInWithGoogle(): Observable<UserCredential> {
    const provider = new GoogleAuthProvider();

    // Optionally, you can add custom scopes or parameters for Google here.
    // For example, to request specific data:
    // provider.addScope('profile');
    // provider.addScope('email');
    // provider.setCustomParameters({ prompt: 'select_account' }); // Always ask user to select account

    // Firebase's signInWithPopup returns a Promise, so we convert it to an Observable
    return from(signInWithPopup(this.firebaseAuth, provider)).pipe(
      map(userCredential => {
        //console.log('Google Sign-in successful!', userCredential.user);
        // You might want to extract just the user object or relevant data
        return userCredential;
      }),
      catchError(error => {
        console.error('Firebase Google Sign-in error:', error);
        let errorMessage = 'An unknown error occurred during Google sign-in.';
        if (error.code) {
          switch (error.code) {
            case 'auth/popup-closed-by-user':
              errorMessage = 'Sign-in window closed. Please try again.';
              break;
            case 'auth/cancelled-popup-request':
              errorMessage = 'Sign-in cancelled. Please try again.';
              break;
            case 'auth/network-request-failed':
              errorMessage = 'Network error. Check your connection.';
              break;
            case 'auth/admin-restricted-operation':
              errorMessage = 'Sign-in is restricted by an administrator.';
              break;
            case 'auth/account-exists-with-different-credential':
              errorMessage = 'Account already exists with a different sign-in method.';
              break;
            case 'auth/operation-not-allowed':
              errorMessage = 'Google sign-in is not enabled for this project. Please enable it in Firebase Console.';
              break;
            case 'auth/unauthorized-domain':
              errorMessage = 'Your app domain is not authorized for OAuth operations. Check Firebase Console.';
              break;
            case 'auth/auth-domain-config-required':
              errorMessage = 'Auth domain configuration is missing. Check Firebase Console.';
              break;
            default:
              errorMessage = `Google Sign-in failed: ${error.message || error.code}`;
          }
        }
        throw new HttpErrorResponse({ error: { message: errorMessage }, status: 400 });
      })
    );
  }

  /**
   * Initiates the Facebook sign-in process using a popup.
   * Returns an Observable of the UserCredential or throws an HttpErrorResponse.
   */
  signInWithFacebook(): Observable<UserCredential> {
    const provider = new FacebookAuthProvider();

    // Optional: You can add custom scopes to request more data from Facebook
    // For example, to get email and public profile:
    // provider.addScope('email');
    // provider.addScope('public_profile');
    // Learn more about Facebook scopes here:
    // https://developers.facebook.com/docs/permissions/reference

    return from(signInWithPopup(this.firebaseAuth, provider)).pipe(
      map(userCredential => {
        console.log('Facebook Sign-in successful!', userCredential.user);
        return userCredential;
      }),
      catchError(error => {
        console.error('Firebase Facebook Sign-in error:', error);
        let errorMessage = 'An unknown error occurred during Facebook sign-in.';
        if (error.code) {
          switch (error.code) {
            case 'auth/popup-closed-by-user':
              errorMessage = 'Sign-in window closed. Please try again.';
              break;
            case 'auth/cancelled-popup-request':
              errorMessage = 'Sign-in cancelled. Please try again.';
              break;
            case 'auth/network-request-failed':
              errorMessage = 'Network error. Check your connection.';
              break;
            case 'auth/admin-restricted-operation':
              errorMessage = 'Sign-in is restricted by an administrator.';
              break;
            case 'auth/account-exists-with-different-credential':
              errorMessage = 'Account already exists with a different sign-in method.';
              break;
            case 'auth/operation-not-allowed':
              errorMessage = 'Facebook sign-in is not enabled for this project. Please enable it in Firebase Console.';
              break;
            case 'auth/unauthorized-domain':
              errorMessage = 'Your app domain is not authorized for OAuth operations. Check Firebase Console.';
              break;
            case 'auth/auth-domain-config-required':
              errorMessage = 'Auth domain configuration is missing. Check Firebase Console.';
              break;
            default:
              errorMessage = `Facebook Sign-in failed: ${error.message || error.code}`;
          }
        }
        throw new HttpErrorResponse({ error: { message: errorMessage }, status: 400 });
      })
    );
  }

  /**
   * Initiates the Twitter sign-in process using a popup.
   * Returns an Observable of the UserCredential or throws an HttpErrorResponse.
   */
  signInWithTwitter(): Observable<UserCredential> { // <--- NEW METHOD
    const provider = new TwitterAuthProvider();

    // Optional: You can add custom scopes if you need specific permissions
    // from the user's Twitter account.
    // Note: Twitter's OAuth 1.0a API (used by Firebase) doesn't use 'scopes'
    // in the same way as OAuth 2.0 (like Google/Facebook).
    // If you need more advanced Twitter API access, you might need to handle
    // the OAuth token exchange on your backend with Cloud Functions.
    // For basic sign-in, no custom scopes are typically needed here.

    return from(signInWithPopup(this.firebaseAuth, provider)).pipe(
      map(userCredential => {
        //console.log('Twitter Sign-in successful!', userCredential.user);
        return userCredential;
      }),
      catchError(error => {
        console.error('Firebase Twitter Sign-in error:', error);
        let errorMessage = 'An unknown error occurred during Twitter sign-in.';
        if (error.code) {
          switch (error.code) {
            case 'auth/popup-closed-by-user':
              errorMessage = 'Sign-in window closed. Please try again.';
              break;
            case 'auth/cancelled-popup-request':
              errorMessage = 'Sign-in cancelled. Only one sign-in operation allowed at a time.';
              break;
            case 'auth/network-request-failed':
              errorMessage = 'Network error. Please check your internet connection.';
              break;
            case 'auth/account-exists-with-different-credential':
              errorMessage = 'Account already exists with a different sign-in method. Try linking accounts.';
              break;
            case 'auth/operation-not-allowed':
              errorMessage = 'Twitter sign-in is not enabled for this project. Please enable it in Firebase Console.';
              break;
            case 'auth/unauthorized-domain':
              errorMessage = 'Your app domain is not authorized for OAuth operations. Verify authorized domains in Firebase Console and Twitter Developer app callback URLs.';
              break;
            case 'auth/auth-domain-config-required':
              errorMessage = 'Auth domain configuration is missing. Check Firebase Console.';
              break;
            case 'auth/timeout':
              errorMessage = 'Twitter sign-in timed out. This might happen if the OAuth callback URL is incorrect or network is slow.';
              break;
            default:
              errorMessage = `Twitter Sign-in failed: ${error.message || error.code}`;
          }
        }
        throw new HttpErrorResponse({ error: { message: errorMessage }, status: 400 });
      })
    );
  }

  // Example for signing out (you might add a button for this later)
  signOut(): Observable<void> {
    return from(this.firebaseAuth.signOut()).pipe(
      map(() => {
        console.log('User signed out.');
        // set user to null
        this.userService.clearUser();
        return;
      }),
      catchError(error => {
        console.error('Sign-out error:', error);
        throw new HttpErrorResponse({ error: { message: 'Failed to sign out.' }, status: 500 });
      })
    );
  }

/**
   * Provides an observable stream of the current Firebase user.
   * Emits null if no user is signed in.
   * This is the recommended way to observe authentication state changes.
   */
  getAuthState(): Observable<User | null> {
    return user(this.firebaseAuth);
  }
}
