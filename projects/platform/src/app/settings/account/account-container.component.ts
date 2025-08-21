import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AccountComponent } from './account.component';
import { UserInterface, UserService } from '../../common/services/user.service';
import { Router } from '@angular/router';

/**
 * Account Container Component
 * 
 * @description Wrapper component for account management that handles user data
 */
@Component({
  selector: 'async-account-container',
  standalone: true,
  imports: [CommonModule, AccountComponent],
  template: `
    <async-account *ngIf="user" [user]="user" />
  `,
})
export class AccountContainerComponent implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  private readonly subscriptions = new Subscription();

  user: UserInterface | null = null;
  private router = inject(Router);

  ngOnInit(): void {
    this.subscribeToCurrentUser();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private subscribeToCurrentUser(): void {
    const userSubscription = this.userService.getCurrentUser$.subscribe({
      next: (user: UserInterface | null) => {
        //console.log('current user ',user)
        this.user = user;
      },
      error: (error) => {
        //console.error('Error fetching user:', error);
        this.user = null;
        this.router.navigate(['/'], { replaceUrl: true });
      }
    });

    this.subscriptions.add(userSubscription);
  }
}