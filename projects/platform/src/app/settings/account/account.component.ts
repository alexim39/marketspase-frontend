import { CommonModule } from '@angular/common';
import { Component, inject, Signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { PersonalInfoComponent } from './personal/personal.component';
import { ProfessionalInfoComponent } from './professional/professional.component';
import { UsernameInfoComponent } from './username/username.component';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { UserService } from '../../common/services/user.service';
import { MatCardModule } from '@angular/material/card';
import { UserInterface } from '../../../../../shared-services/src/public-api';

@Component({
  selector: 'async-account',
  standalone: true,
  imports: [
    PersonalInfoComponent,
    ProfessionalInfoComponent,
    UsernameInfoComponent,
    CommonModule,  
    MatExpansionModule,  
    MatIconModule,
    MatButtonModule,
    RouterModule,
    MatCardModule
  ],
  template: `
    <div class="account-container">
      <mat-card class="settings-card">
        <mat-accordion>
          <mat-expansion-panel [expanded]="true">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>person</mat-icon> Personal Information
              </mat-panel-title>
            </mat-expansion-panel-header>
            @if (user()) {
              <async-personal-infor [user]="user"/>
            }
            
          </mat-expansion-panel>

          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>work</mat-icon> Professional Information
              </mat-panel-title>
            </mat-expansion-panel-header>
            @if (user()) {
               <async-professional-info [user]="user"/>
            }
           
          </mat-expansion-panel>
        
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>alternate_email</mat-icon> Username
              </mat-panel-title>
            </mat-expansion-panel-header>
            @if (user()) {
              <async-username-info [user]="user"/>
            }
            
          </mat-expansion-panel>
        
        </mat-accordion>
      </mat-card>
    </div>
  `,
  styles: [`
    .account-container {
      width: 100%;
      margin: 0 auto;
      padding: 16px;
    }

    .settings-card {
      width: 100%;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    ::ng-deep .mat-expansion-panel {
      box-shadow: none;
      border-radius: 0;
      border-bottom: 1px solid #e5e5e5;

      &:last-child {
        border-bottom: none;
      }

      .mat-expansion-panel-header {
        height: 64px;
        padding: 0 24px;

        .mat-content {
          align-items: center;
        }

        mat-icon {
          color: #667eea;
          margin-right: 16px;
        }

        .mat-expansion-panel-header-title {
          font-weight: 500;
        }
      }
    }

    @media (max-width: 768px) {
      .account-container {
        padding: 3px;;
      }
      
      ::ng-deep .mat-expansion-panel-header {
        padding: 0 16px;
      }
    }
  `]
})
export class AccountComponent {
 private userService = inject(UserService);
   // Expose the signal directly to the template
   public user: Signal<UserInterface | null> = this.userService.user;

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}