import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-boost-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="boost-dialog" role="dialog" aria-labelledby="boost-dialog-title" aria-describedby="boost-dialog-description">
      <div class="dialog-hero">
        <div class="icon-badge">
          <mat-icon>bolt</mat-icon>
        </div>
        <div class="hero-copy">
          <p class="eyebrow">Promote your content</p>
          <h2 id="boost-dialog-title">Boost this post?</h2>
        </div>
      </div>

      <p id="boost-dialog-description" class="dialog-body">
        Give this post a <strong>24-hour spotlight</strong> in the community feed and reach more people faster.
        A charge of <strong>₦500</strong> will be deducted from your wallet balance.
      </p>

      <div class="dialog-highlight">
        <mat-icon>trending_up</mat-icon>
        <span>Higher visibility for your next campaign moment.</span>
      </div>

      <div class="dialog-actions">
        <button mat-stroked-button (click)="close(false)">Cancel</button>
        <button mat-flat-button color="primary" (click)="close(true)">
          <mat-icon>bolt</mat-icon>
          <span>Boost for ₦500</span>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./boost-confirm-dialog.component.scss']
})
export class BoostConfirmDialogComponent {
  private dialogRef = inject(MatDialogRef<BoostConfirmDialogComponent>);

  close(confirmed: boolean): void {
    this.dialogRef.close(confirmed);
  }
}
