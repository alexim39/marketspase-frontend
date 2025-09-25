import { Component, inject, Signal} from '@angular/core';
import { MatTabsModule} from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { NotificationSettingsComponent } from './notification/notification.component';
import { UserService } from '../../common/services/user.service';
import { MatCardModule } from '@angular/material/card';
import { UserInterface } from '../../../../../shared-services/src/public-api';
import { AdsSettingsComponent } from './ads/ads.component';


@Component({
  selector: 'async-system-setting',
  standalone: true,
  imports: [MatTabsModule, MatCardModule, CommonModule, MatIconModule, AdsSettingsComponent, NotificationSettingsComponent],
  template: `
  <div class="settings-container">

    <div class="settings-content">

      <mat-card class="settings-card">
        <mat-tab-group animationDuration="200ms">
          <mat-tab label="Notifications"> 
            @if (user()) {
              <async-notification [user]="user"/>
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
  styles: [`
  .settings-container {
    width: 100%;
  }

  .settings-content {
    margin: 24px auto;
    padding: 0 24px;
    width: auto;
  }

  .settings-nav {
    margin-bottom: 24px;

    button {
      //background-color: white;
      color: #667eea;
      border: 1px solid #e5e5e5;
      border-radius: 4px;
      padding: 8px 16px;
      font-weight: 500;
      display: flex;
      align-items: center;

      mat-icon {
        margin-right: 8px;
      }

      &:hover {
        background-color: rgba(143, 0, 69, 0.04);
      }
    }
  }

  .settings-card {
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    overflow: hidden;

    ::ng-deep .mat-tab-group {
      .mat-tab-header {
        border-bottom: none;
        //background-color: white;
      }

      .mat-tab-label {
        height: 48px;
        font-weight: 500;
        color: #606060;
        opacity: 1;

        &:hover {
          color: #8f0045;
        }
      }

      .mat-tab-label-active {
        color: #8f0045;
      }

      .mat-ink-bar {
        background-color: #8f0045;
        height: 3px;
      }

      .mat-tab-body-content {
        padding: 24px;
      }
    }
  }

  @media (max-width: 768px) {
    .settings-content {
      padding: 0 16px;
    }

    .header-main h1 {
      font-size: 20px;
    }
  }
  `]
})
export class SystemSettingComponent {
  private userService = inject(UserService);
  // Expose the signal directly to the template
  public user: Signal<UserInterface | null> = this.userService.user;
}