import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog } from '@angular/material/dialog';
import { PersonalInfoComponent } from './personal/personal.component';
import { ProfessionalInfoComponent } from './professional/professional.component';
import { UsernameInfoComponent } from './username/username.component';
import { PasswordChangeComponent } from './password/password.component';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { UserInterface } from '../../common/services/user.service';
import { HelpDialogComponent } from '../../common/help-dialog.component';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'async-account',
  standalone: true,
  imports: [
    PersonalInfoComponent,
    ProfessionalInfoComponent,
    UsernameInfoComponent,
    PasswordChangeComponent,
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
            <async-personal-infor *ngIf="user" [user]="user"/>
          </mat-expansion-panel>

          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>work</mat-icon> Professional Information
              </mat-panel-title>
            </mat-expansion-panel-header>
            <async-professional-info *ngIf="user" [user]="user"/>
          </mat-expansion-panel>
        
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>alternate_email</mat-icon> Username
              </mat-panel-title>
            </mat-expansion-panel-header>
            <async-username-info *ngIf="user" [user]="user"/>
          </mat-expansion-panel>
        
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>lock</mat-icon> Password
              </mat-panel-title>
            </mat-expansion-panel-header>
            <async-password-changer *ngIf="user" [user]="user"/>
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
          color: #8f0045;
          margin-right: 16px;
        }

        .mat-expansion-panel-header-title {
          font-weight: 500;
        }
      }
    }

    @media (max-width: 768px) {
      .account-container {
        padding: 8px;
      }
      
      ::ng-deep .mat-expansion-panel-header {
        padding: 0 16px;
      }
    }
  `]
})
export class AccountComponent {
  @Input() user!: UserInterface;

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}