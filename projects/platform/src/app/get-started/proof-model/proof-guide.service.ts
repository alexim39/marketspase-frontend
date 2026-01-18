import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProofGuideModalComponent } from './proof-guide-modal.component';

@Injectable()
export class ProofGuideService {
  constructor(private dialog: MatDialog) {}

  openProofGuide(): void {
    this.dialog.open(ProofGuideModalComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'proof-guide-dialog',
      disableClose: false,
      autoFocus: false
    });
  }
}