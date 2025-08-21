import { Component, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  @if (user()) {
    <async-account [user]="user" />
  }
    
  `,
})
export class AccountContainerComponent{
  private userService = inject(UserService);
  // Expose the signal directly to the template
  public user: Signal<UserInterface | null> = this.userService.user;
}