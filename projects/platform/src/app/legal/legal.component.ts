import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'async-legal',
  standalone: true,
  imports: [MatButtonModule, MatDividerModule, CommonModule, MatListModule, RouterModule],
  template: `
    <section class="legal">
      
      <div class="legal-menu">
        <mat-list>
            <mat-list-item> 
                <a [routerLink]="['/']" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Back to App</a>
            </mat-list-item>
            <mat-divider></mat-divider>
            <mat-list-item> 
                <a [routerLink]="['terms']" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Terms of Service</a>
            </mat-list-item>
            <mat-divider></mat-divider>
            <mat-list-item> 
                <a [routerLink]="['privacy']" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Privacy Policy</a>
            </mat-list-item>
            <mat-divider></mat-divider>
            <mat-list-item>
                <a [routerLink]="['cookies']" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Cookies Policy</a>
            </mat-list-item>
            <mat-divider></mat-divider>
        </mat-list>
      </div>

      <div class="legal-content">
          <router-outlet></router-outlet>
      </div>
    </section>
  `,
  styles: [`
.legal {
  display: flex;
  flex-direction: row;
  gap: 2em;
  padding: 2em 4em;
  background: #f9f9f9; /* Light background for better readability */
  border-radius: 12px; /* Rounded corners for a modern look */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); /* Subtle shadow for depth */
}

.legal-menu {
  flex: 25%; /* Slightly wider menu */
  padding-right: 2em;
  border-right: 1px solid #e0e0e0; /* Softer border color */
}

.legal-menu mat-list {
  background: #ffffff; /* White background for the menu */
  border-radius: 8px; /* Rounded corners for the menu */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); /* Subtle shadow for depth */
}

.legal-menu mat-list-item {
  padding: 1em 0.5em;
  transition: background 0.2s ease, color 0.2s ease; /* Smooth hover effect */
}

.legal-menu mat-list-item a {
  text-decoration: none;
  color: #333; /* Darker text for better readability */
  font-weight: 600;
  font-size: 1rem; /* Modern font size */
}

.legal-menu mat-list-item a:hover {
  color: #667eea; /* Primary hover color */
}

.legal-menu mat-list-item a.active {
  color: #667eea; /* Highlight active link */
  font-weight: 700; /* Bold active link */
}

.legal-menu mat-divider {
  background: #e0e0e0; /* Softer divider color */
}

.legal-content {
  flex: 75%; /* Wider content area */
  padding-left: 2em;
  background: #ffffff; /* White background for content */
  border-radius: 8px; /* Rounded corners for content */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); /* Subtle shadow for depth */
  padding: 2em;
  font-size: 1rem;
  color: #444; /* Slightly darker text for readability */
  line-height: 1.6; /* Improved line spacing for readability */
}

/* Mobile Responsiveness */
@media only screen and (max-width: 768px) {
  .legal {
    flex-direction: column;
    padding: 1em;
    gap: 1em;
  }

  .legal-menu {
    flex: 100%;
    padding-right: 0;
    border-right: none;
    border-bottom: 1px solid #e0e0e0; /* Add bottom border for separation */
  }

  .legal-content {
    flex: 100%;
    padding: 1.5em;
  }
}

@media only screen and (max-width: 480px) {
  .legal-menu mat-list-item {
    padding: 0.8em 0.5em;
  }

  .legal-menu mat-list-item a {
    font-size: 0.9rem; /* Slightly smaller font size for smaller screens */
  }

  .legal-content {
    padding: 1em;
    font-size: 0.9rem; /* Adjust font size for smaller screens */
  }
}
  `]
})
export class LegalComponent { }
