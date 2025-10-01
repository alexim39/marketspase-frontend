import { Component, DestroyRef, effect, inject, Input, OnDestroy, signal, Signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { SettingsService, NotificationInterface } from '../system.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserInterface } from '../../../../../../shared-services/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'async-notification',
  template: `
  <div class="notification-settings">
  <h3 class="section-title">Notifications</h3>
  <p class="section-description">Manage how you receive notifications from MarketSpase</p>

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
        [checked]="isTurnedOn()"
        (change)="toggleNotification($event)"
        color="primary">
      </mat-slide-toggle>
    </div>

    <div class="notification-types">
      <h5>Notification Types</h5>
      <div class="type-options">
        <div class="type-option">
          <mat-icon>campaign</mat-icon>
          <span>New campaign from advertisers</span>
        </div>
        <div class="type-option">
          <mat-icon>event</mat-icon>
          <span>General events and information from MarketSpase</span>
        </div>
        <div class="type-option">
          <mat-icon>bookmark_heart</mat-icon>
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
            color: #667eea;
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
            background-color: #667eea;
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
export class NotificationSettingsComponent {
 // Required input that expects a signal of type UserInterface or undefined
  @Input({ required: true }) user!: Signal<UserInterface | null>;

  // Use a signal for the state of the slide toggle
  isTurnedOn: WritableSignal<boolean> = signal(false);

  private readonly snackBar = inject(MatSnackBar);
  private readonly settingsService = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Use an effect to react to changes in the user signal
    effect(() => {
      // Automatically update isTurnedOn whenever the user signal changes
      this.isTurnedOn.set(this.user()?.preferences?.notification || false);
    });
  }

  

  toggleNotification(event: MatSlideToggleChange): void {
    const isChecked = event.checked;
    // Update the signal immediately to reflect the change in the UI
    this.isTurnedOn.set(isChecked);

    const formObject: NotificationInterface = {
      state: isChecked,
      userId: this.user()?._id! // Add non-null assertion as `user` is required
    };
    this.sendNotificationStateToBackend(formObject);
  }

  private sendNotificationStateToBackend(formObject: NotificationInterface): void {
    // Use `toObservable` from `@angular/core/rxjs-interop` to convert the `user` signal to an observable
    // if you need to use it in an observable chain. However, in this case, direct signal access is fine.

    // Using `takeUntilDestroyed` from `@angular/core/rxjs-interop` is a modern way to manage subscriptions
    // and automatically unsubscribe when the component is destroyed. This removes the need for `ngOnDestroy`.
    // this.settingsService.toggleNotification(formObject).pipe(takeUntilDestroyed()).subscribe({ ... });

    // A simpler and often preferred approach is to just use the `subscribe` call
    // directly and let the component lifecycle manage it, especially for short-lived subscriptions.
    this.settingsService.toggleNotification(formObject)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (response) => {
        this.snackBar.open(response.message, 'Ok', { duration: 3000 });
      },
      error: (error: HttpErrorResponse) => {
        // Since we are not using a `isSpinning` signal, the state is managed by the component.
        // It's a good practice to handle the error and revert the state if the backend call fails.
        // Revert the signal's value to its previous state on error
        this.isTurnedOn.set(!this.isTurnedOn());

        let errorMessage = 'Server error occurred, please try again.'; // default error message.
        if (error.error && error.error.message) {
          errorMessage = error.error.message; // Use backend's error message if available.
        }
        this.snackBar.open(errorMessage, 'Ok', { duration: 3000 });
      }
    });
  }
}