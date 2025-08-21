import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { SettingsService, NotificationInterface } from '../system.service';
import { HttpErrorResponse } from '@angular/common/http';
import { UserInterface } from '../../../common/services/user.service';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'async-notification',
  template: `
    <div class="notification-settings">
      <h3 class="section-title">Notifications</h3>
      <p class="section-description">Manage how you receive notifications from Davidotv</p>

      <mat-card class="setting-card">
        <div class="setting-row">
          <div class="setting-info">
            <mat-icon>notifications</mat-icon>
            <div>
              <h4>Email Notifications</h4>
              <p>Receive email notifications for new content and updates</p>
            </div>
          </div>
          <mat-slide-toggle 
            [checked]="isTurnedOn" 
            (change)="toggleNotification($event)"
            color="primary">
          </mat-slide-toggle>
        </div>

        <div class="notification-types">
          <h5>Notification Types</h5>
          <div class="type-options">
            <div class="type-option">
              <mat-icon>video_library</mat-icon>
              <span>New videos from followed artists</span>
            </div>
            <div class="type-option">
              <mat-icon>event</mat-icon>
              <span>Upcoming events and concerts</span>
            </div>
            <div class="type-option">
              <mat-icon>campaign</mat-icon>
              <span>Promotions and special offers</span>
            </div>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .notification-settings {
      padding: 1em;
      .section-title {
        font-size: 18px;
        font-weight: 500;
        margin: 0 0 8px;
        //color: #030303;
      }

      .section-description {
        font-size: 14px;
        color: #606060;
        margin: 0 0 24px;
      }

      .setting-card {
        padding: 16px;
        border-radius: 8px;
      }

      .setting-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #e5e5e5;

        .setting-info {
          display: flex;
          align-items: center;

          mat-icon {
            color: #8f0045;
            margin-right: 16px;
            font-size: 24px;
            width: 24px;
            height: 24px;
          }

          h4 {
            margin: 0;
            font-size: 16px;
            font-weight: 500;
          }

          p {
            margin: 4px 0 0;
            font-size: 14px;
            color: #606060;
          }
        }

        ::ng-deep .mat-slide-toggle {
          .mat-slide-toggle-bar {
           // background-color: #ccc;
          }

          &.mat-checked .mat-slide-toggle-bar {
            background-color: rgba(143, 0, 69, 0.54);
          }

          .mat-slide-toggle-thumb {
            //background-color: #f1f1f1;
          }

          &.mat-checked .mat-slide-toggle-thumb {
            background-color: #8f0045;
          }
        }
      }

      .notification-types {
        margin-top: 16px;

        h5 {
          margin: 16px 0 12px;
          font-size: 15px;
          font-weight: 500;
          color: #030303;
        }

        .type-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .type-option {
          display: flex;
          align-items: center;
          padding: 8px;
          border-radius: 4px;
          background-color: #f9f9f9;

          mat-icon {
            color: #606060;
            margin-right: 12px;
            font-size: 20px;
            width: 20px;
            height: 20px;
          }

          span {
            font-size: 14px;
            color: #606060;
          }
        }
      }
    }
  `],
  standalone: true,
  imports: [MatExpansionModule, CommonModule, MatSlideToggleModule, MatIconModule, MatCardModule],
  providers: [SettingsService],
})
export class NotificationSettingsComponent implements OnInit, OnDestroy {
  @Input() user!: UserInterface;
  subscriptions: Array<Subscription> = [];
  isTurnedOn: boolean = false;
  private snackBar = inject(MatSnackBar);

  constructor(
     private settingsService: SettingsService,
  ) {}

  ngOnInit(): void {
    this.isTurnedOn = this.user.preferences.notification;
  }

  toggleNotification(event: MatSlideToggleChange): void {
    this.isTurnedOn = event.checked;
    const formObject = {
      state: this.isTurnedOn,
      userId: this.user._id 
    }
    this.sendNotificationStateToBackend(formObject);
  }

  private sendNotificationStateToBackend(formObject: NotificationInterface): void {
    this.subscriptions.push(
      this.settingsService.toggleNotification(formObject).subscribe({
        next: (response) => {
          this.snackBar.open(response.message, 'Ok',{duration: 3000});
        },
         error: (error: HttpErrorResponse) => {
          //this.isSpinning = false;

          let errorMessage = 'Server error occurred, please try again.'; // default error message.
          if (error.error && error.error.message) {
            errorMessage = error.error.message; // Use backend's error message if available.
          }  
          this.snackBar.open(errorMessage, 'Ok',{duration: 3000});
          //this.cdr.markForCheck();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}