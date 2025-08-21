import { CommonModule } from '@angular/common';
import { Component, inject, Signal } from '@angular/core';
import { SystemSettingComponent } from './system.component';
import { UserInterface, UserService } from '../../common/services/user.service';

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
  @if (user()) {
    <async-system-setting [user]="user"/>
  }
    
  `,
})
export class SystemSettingContainerComponent {
  private userService = inject(UserService);

  // Expose the signal directly to the template
  public user: Signal<UserInterface | null> = this.userService.user;

}