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
  styleUrls: ['./account.component.scss']
})
export class AccountComponent {
 private userService = inject(UserService);
   // Expose the signal directly to the template
   public user: Signal<UserInterface | null> = this.userService.user;

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}