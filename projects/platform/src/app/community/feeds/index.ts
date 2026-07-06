import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  Type,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../common/services/user.service';
import { DeviceService } from '@shared/services/device';
import { UserInterface } from '@shared/services';

@Component({
  selector: 'feed-index',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      
      <!-- Main Content -->
      @if (user()) {
        <div class="page-wrapper" [attr.data-device]="deviceType()">
          <main class="page-main" role="main">
            @if (activeFeedComponent(); as feedComponent) {
              <ng-container *ngComponentOutlet="feedComponent; inputs: feedComponentInputs"></ng-container>
            }
          </main>
        </div>
      }
      
      <!-- Fallback for unauthenticated users (shouldn't normally show due to redirect) -->
      @else {
        <div class="error-state" role="alert">
          <div class="error-content">
            <h2 class="error-title">Access Denied</h2>
            <p class="error-subtitle">Redirecting to login page...</p>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./index.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedIndexComponent {
  private readonly deviceService = inject(DeviceService);
  private readonly userService = inject(UserService);
  private componentLoadVersion = 0;

  // Computed properties for better performance
  protected readonly deviceType = computed(() => this.deviceService.type());
  protected readonly activeFeedComponent = signal<Type<unknown> | null>(null);

  // Expose the signal directly to the template
  public readonly user: Signal<UserInterface | null> = this.userService.user;
  protected readonly feedComponentInputs = { user: this.user };

  constructor() {
    effect(() => {
      void this.resolveActiveFeedComponent(this.deviceType());
    });
  }

  protected async resolveActiveFeedComponent(deviceType: string): Promise<void> {
    const nextVersion = this.componentLoadVersion + 1;
    this.componentLoadVersion = nextVersion;

    const component =
      deviceType === 'desktop'
        ? (await import('./feed-page.component')).DesktopFeedPageComponent
        : (await import('./feed-page-mobile/feed-page-mobile.component')).MobileFeedComponent;

    if (this.componentLoadVersion === nextVersion) {
      this.activeFeedComponent.set(component);
    }
  }
}
