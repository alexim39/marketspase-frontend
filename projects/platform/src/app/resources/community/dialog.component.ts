import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sign-in-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, RouterLink],
  template: `
    <h2 mat-dialog-title>Get Started</h2>
    <mat-dialog-content>
      <p>Please sign in to participate in the community and start a new discussion.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-raised-button color="primary" [routerLink]="['/']" (click)="close()">
        Sign In
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { font-size: 1.1rem; padding-bottom: 20px; }
  `]
})
export class SignInDialogComponent {
  constructor(private dialogRef: MatDialogRef<SignInDialogComponent>) {}

  close(): void {
    this.dialogRef.close();
  }
}
