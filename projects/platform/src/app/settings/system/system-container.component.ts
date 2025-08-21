import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SystemSettingComponent } from './system.component';
import { UserInterface, UserService } from '../../common/services/user.service';
import { Router } from '@angular/router';

/**
 * System settings container component
 * 
 * @description Wrapper component for system settings that handles user data
 */
@Component({
  selector: 'async-system-setting-container',
  standalone: true,
  imports: [CommonModule, SystemSettingComponent],
  template: `
    <async-system-setting *ngIf="user" [user]="user"/>
  `,
})
export class SystemSettingContainerComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private subscriptions: Subscription = new Subscription();

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
       // console.log('current user ',user)
        this.user = user;
      },
      error: (error) => {
        console.error('Error fetching user:', error);
        this.user = null;
        this.router.navigate(['/'], { replaceUrl: true });
        
      }
    });

    this.subscriptions.add(userSubscription);
  }
}