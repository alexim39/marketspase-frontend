import { CommonModule } from '@angular/common';
import { Component, inject, Signal } from '@angular/core';
import { AppReviewSettingComponent } from './app-review.component';
import { UserInterface, UserService } from '../../common/services/user.service';

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
  @if (user()) {
    <async-review-setting [user]="user"/>
  }
    
  `,
})
export class AppReveiwSettingContainerComponent {
  private userService = inject(UserService);
  // Expose the signal directly to the template
  public user: Signal<UserInterface | null> = this.userService.user;
}