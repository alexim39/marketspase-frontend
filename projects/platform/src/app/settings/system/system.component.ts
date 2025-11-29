import { Component, inject, Signal} from '@angular/core';
import { MatTabsModule} from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { NotificationSettingsComponent } from './notification/notification.component';
import { UserService } from '../../common/services/user.service';
import { MatCardModule } from '@angular/material/card';
import { UserInterface } from '../../../../../shared-services/src/public-api';
import { AdsSettingsComponent } from './ads/ads.component';
import {MatExpansionModule} from '@angular/material/expansion';
import { ThemeSettingsComponent } from './theme/theme.component';


@Component({
  selector: 'async-system-setting',
  standalone: true,
  imports: [MatTabsModule, MatCardModule, CommonModule, MatIconModule, AdsSettingsComponent, NotificationSettingsComponent, MatExpansionModule, ThemeSettingsComponent],
  template: `
  <div class="settings-container">

    <div class="settings-content">

      <mat-card class="settings-card">
        <mat-tab-group animationDuration="200ms">
          <mat-tab label="Notifications & Themes"> 
            @if (user()) {
              
              <mat-accordion>
                <mat-expansion-panel [expanded]="true">
                  <mat-expansion-panel-header>
                    <mat-panel-title> Notification Settings</mat-panel-title>
                  </mat-expansion-panel-header>
                  <async-notification [user]="user"/>
                </mat-expansion-panel>

                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title> Theme Settings </mat-panel-title>
                  </mat-expansion-panel-header>

                  <async-theme-settings [user]="user"/>
                  
                </mat-expansion-panel>
              </mat-accordion>


            }
          </mat-tab>
          <mat-tab label="Ads Preferences">
            @if (user()) {
              <async-ads [user]="user"/>
            }
          </mat-tab>
          
        </mat-tab-group>
      </mat-card>
    </div>
  </div>
  `,
  styleUrls: ['./system.component.scss']
})
export class SystemSettingComponent {
  private userService = inject(UserService);
  // Expose the signal directly to the template
  public user: Signal<UserInterface | null> = this.userService.user;
}