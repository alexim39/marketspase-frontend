import { Component, computed, DestroyRef, effect, inject, OnDestroy, Signal, signal } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { TestimonialWriteupSettingsComponent } from './testimonial-writeup/testimonial-writeup.component';
import { UserService } from '../../common/services/user.service';
import { MatCardModule } from '@angular/material/card';
import { SupportService } from './support.service';
import { ContactComponent } from './contact/contact.component';
import { UserInterface } from '../../../../../shared-services/src/public-api';
import { Subject, takeUntil } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'async-review-setting',
  standalone: true,
  providers: [SupportService],
  imports: [
    MatTabsModule,
    CommonModule,
    MatButtonModule,
    TestimonialWriteupSettingsComponent,
    MatCardModule,
    ContactComponent
  ],
  template: `
    <div class="social-settings-container">
      <div class="settings-content">
        <div class="social-settings-content">
          <mat-card class="settings-card">
            <mat-tab-group animationDuration="200ms">
              <mat-tab label="Contact Support">
                <div class="tab-content">
                  @if (user()) {
                    <async-contact [user]="user" />
                  }
                </div>
              </mat-tab>

              <mat-tab label="Testimonial">
                <div class="tab-content">
                  @if (user()) {
                    <async-testimonial-writeup-settings
                      [user]="user"
                      [testimonial]="testimonial"
                      [isLoading]="isLoading"
                      [error]="error"
                    />
                  }
                </div>
              </mat-tab>
            </mat-tab-group>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .social-settings-container {
    min-height: 100vh;
    padding: 0;
  }


  .settings-content {
    max-width: 1200px;
    margin: 24px auto;
    padding: 0 24px;
  }

  .settings-nav {
    margin-bottom: 24px;

    button {
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


  .social-settings-content {
    max-width: 1200px;
    margin: 24px auto;
    padding: 0 24px;
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
          color: #667eea;
        }
      }

      .mat-tab-label-active {
        color: #667eea;
      }

      .mat-ink-bar {
        background-color: #667eea;
        height: 3px;
      }

      .mat-tab-body-content {
        padding: 24px;
      }
    }

    .tab-content {
      padding: 16px 0;
    }
  }

  @media (max-width: 768px) {
    .social-settings-content {
      padding: 0 16px;
    }

    .header-main h1 {
      font-size: 20px;
    }
  }
  `],
})
export class SupportComponent implements OnDestroy {
  private userService = inject(UserService);
  private support = inject(SupportService);

  // Expose user as signal
  readonly user: Signal<UserInterface | null> = this.userService.user;

  // Local state signals
  readonly testimonial = signal<any | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Reactively fetch testimonials whenever user changes
   effect(() => {
      const user = this.user();
      if (!user?._id) return;

      this.isLoading.set(true);
      this.error.set(null);

      this.support.getTestimonial(user._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            //console.log('Fetched testimonial:', response);
            this.testimonial.set(response.data || null);
            this.isLoading.set(false);
          }
        },
        error: (err) => {
          this.error.set('Failed to load testimonial.');
          this.isLoading.set(false);
          console.error(err);
        }
      });
    });
  }

  
  ngOnDestroy(): void {
    // this.destroy$.next();
    // this.destroy$.complete();
  }


  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
