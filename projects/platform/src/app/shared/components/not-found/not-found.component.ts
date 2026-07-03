import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule, MatButtonModule],
  template: `
    <div class="not-found">
      <div class="nf-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <a mat-stroked-button routerLink="/dashboard">Go to Dashboard</a>
        <a mat-button routerLink="/">Go Home</a>
      </div>
    </div>
  `,
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent {}
