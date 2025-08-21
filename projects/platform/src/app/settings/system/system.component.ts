import {Component, inject, Input} from '@angular/core';
import {MatTabsModule} from '@angular/material/tabs';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
//import { DarkThemeSettingsComponent } from './dark-theme/dark-theme.component';
import { CommonModule } from '@angular/common';
import { NotificationSettingsComponent } from './notification/notification.component';
import { HelpDialogComponent } from '../../common/help-dialog.component';
import { UserInterface } from '../../common/services/user.service';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'async-system-setting',
  standalone: true,
  imports: [MatTabsModule, RouterModule, MatCardModule, CommonModule, MatIconModule, MatButtonModule, NotificationSettingsComponent],
  template: `
  <div class="settings-container">

    <div class="settings-content">

      <mat-card class="settings-card">
        <mat-tab-group animationDuration="200ms">
          <!-- <mat-tab label="Appearance">
            <async-dark-theme-settings *ngIf="user" [user]="user"/>
          </mat-tab> -->
          <mat-tab label="Notifications"> 
            <async-notification *ngIf="user" [user]="user"/>
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
      color: #8f0045;
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
  @Input() user!: UserInterface;
  readonly dialog = inject(MatDialog);

  constructor(
      private router: Router,
  ) { }
  
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showDescription() {
    this.dialog.open(HelpDialogComponent, {
      data: {help: 'In this section, you can set up your page look and feel'},
      panelClass: 'help-dialog'
    });
  }
}