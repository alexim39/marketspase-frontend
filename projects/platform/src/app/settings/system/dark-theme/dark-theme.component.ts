import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SettingsService } from '../system.service';
import { ThemeTogglerService } from './theme-toggle.service';
import { UserInterface } from '../../../common/services/user.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'async-dark-theme-settings',
  template: `
    <div class="theme-settings">
      <h3 class="section-title">Appearance</h3>
      <p class="section-description">Customize how Davidotv looks on your device</p>

      <mat-card class="setting-card">
        <div class="setting-row">
          <div class="setting-info">
            <mat-icon>dark_mode</mat-icon>
            <div>
              <h4>Dark theme</h4>
              <p>Set dark theme for better night viewing</p>
            </div>
          </div>
          <mat-slide-toggle 
            [checked]="isDarkMode" 
            (change)="toggleTheme($event)"
            color="primary">
          </mat-slide-toggle>
        </div>

        <div class="theme-preview">
          <div class="preview-container" [class.dark]="isDarkMode">
            <div class="preview-header">
              <div class="preview-nav"></div>
            </div>
            <div class="preview-content">
              <div class="preview-sidebar"></div>
              <div class="preview-main">
                <div class="preview-card"></div>
                <div class="preview-card"></div>
              </div>
            </div>
          </div>
          <p class="preview-label">{{isDarkMode ? 'Dark' : 'Light'}} theme preview</p>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .theme-settings {
      .section-title {
        font-size: 18px;
        font-weight: 500;
        margin: 0 0 8px;
        color: #030303;
      }

      .section-description {
        font-size: 14px;
        color: #606060;
        margin: 0 0 24px;
      }

      .setting-card {
        padding: 16px;
        margin-bottom: 24px;
        border-radius: 8px;
      }

      .setting-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 0;

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
            background-color: #ccc;
          }

          &.mat-checked .mat-slide-toggle-bar {
            background-color: rgba(143, 0, 69, 0.54);
          }

          .mat-slide-toggle-thumb {
            background-color: #f1f1f1;
          }

          &.mat-checked .mat-slide-toggle-thumb {
            background-color: #8f0045;
          }
        }
      }

      .theme-preview {
        margin-top: 24px;
        border-top: 1px solid #e5e5e5;
        padding-top: 24px;

        .preview-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.3s ease;

          &.dark {
            background: #282828;
          }
        }

        .preview-header {
          height: 40px;
          background: #8f0045;
        }

        .preview-content {
          display: flex;
          height: 120px;
        }

        .preview-sidebar {
          width: 60px;
          background: #f9f9f9;
          border-right: 1px solid #e5e5e5;

          .dark & {
            background: #202020;
            border-right-color: #383838;
          }
        }

        .preview-main {
          flex: 1;
          padding: 8px;
          display: flex;
          gap: 8px;
        }

        .preview-card {
          flex: 1;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 4px;

          .dark & {
            background: #383838;
            border-color: #505050;
          }
        }

        .preview-label {
          text-align: center;
          margin: 8px 0 0;
          font-size: 13px;
          color: #606060;
        }
      }
    }
  `],
  standalone: true,
  imports: [MatExpansionModule, CommonModule, MatCardModule, MatIconModule, MatInputModule, MatSlideToggleModule, MatButtonModule, ReactiveFormsModule, MatFormFieldModule],
  providers: [SettingsService, ThemeTogglerService],
})
export class DarkThemeSettingsComponent implements OnInit, OnDestroy {
  @Input() user!: UserInterface;
  subscriptions: Subscription[] = [];
  isDarkMode: boolean = false;

  constructor(
    private settingsService: SettingsService,
    private themeTogglerService: ThemeTogglerService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (!this.user || !this.user._id) return;

    this.subscriptions.push(
      this.settingsService.getThemeSetting(this.user._id).subscribe({
        next: (res: any) => {
          this.isDarkMode = res.darkMode;
          this.themeTogglerService.setTheme(this.isDarkMode ? 'dark' : 'light');
          localStorage.setItem('selectedTheme', this.isDarkMode ? 'dark' : 'light');
          this.cdr.markForCheck();
        },
        error: () => {
          this.isDarkMode = this.themeTogglerService.getTheme() === 'dark';
          this.themeTogglerService.setTheme(this.isDarkMode ? 'dark' : 'light');
        },
      })
    )    
  }

  toggleTheme(event: MatSlideToggleChange): void {
    if (!this.user || !this.user._id) return;
  
    this.isDarkMode = event.checked;
    const formObject = {
      state: this.isDarkMode,
      userId: this.user._id,
    };
  
    this.sendThemeStateToBackend(formObject);
  }

  private sendThemeStateToBackend(formObject: { state: boolean; userId: string }): void {
    this.subscriptions.push(
      this.settingsService.toggleTheme(formObject).subscribe({
        next: () => {
          this.themeTogglerService.setTheme(formObject.state ? 'dark' : 'light');
          localStorage.setItem('selectedTheme', formObject.state ? 'dark' : 'light');
          this.cdr.markForCheck();
        },
        error: () => {},
      })
    )
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}