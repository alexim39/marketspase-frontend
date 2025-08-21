import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppReviewSettingComponent } from './app-review.component';
import { UserInterface, UserService } from '../../common/services/user.service';
import { Router } from '@angular/router';

/**
 * Social Media Page Settings Container Component
 * 
 * @description Wrapper component for social media page settings that manages user data
 */
@Component({
  selector: 'async-review-setting-container',
  standalone: true,
  imports: [CommonModule, AppReviewSettingComponent],
  template: `
    <async-review-setting 
      *ngIf="user" 
      [user]="user"
    />
  `,
})
export class AppReveiwSettingContainerComponent implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  private readonly subscription = new Subscription();

  user: UserInterface | null = null;
  private router = inject(Router);

  ngOnInit(): void {
    this.subscribeToCurrentUser();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private subscribeToCurrentUser(): void {
    const userSubscription = this.userService.getCurrentUser$.subscribe({
      next: (user: UserInterface | null) => {
        this.user = user;
      },
      error: (error: unknown) => {
        //console.error('Failed to load user data:', error);
        this.user = null;
        this.router.navigate(['/'], { replaceUrl: true });
      }
    });

    this.subscription.add(userSubscription);
  }
}