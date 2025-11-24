// shared/services/dialog.service.ts
import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialog = inject(MatDialog);

  confirm(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog.open(ConfirmDialogComponent, {
      data,
      width: '400px',
      disableClose: false,
      autoFocus: true,
      panelClass: 'confirm-dialog-panel'
    }).afterClosed();
  }

  // Convenience methods for common confirm dialogs
  confirmDelete(itemName: string, itemType: string = 'item'): Observable<boolean> {
    return this.confirm({
      title: `Delete ${itemType}`,
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmColor: 'warn',
      icon: 'delete_forever',
      iconColor: 'warn'
    });
  }

  confirmDeactivate(itemName: string, itemType: string = 'item'): Observable<boolean> {
    return this.confirm({
      title: `Deactivate ${itemType}`,
      message: `Are you sure you want to deactivate "${itemName}"?`,
      confirmText: 'Deactivate',
      cancelText: 'Keep Active',
      confirmColor: 'warn',
      icon: 'pause_circle',
      iconColor: 'warn'
    });
  }

  confirmActivate(itemName: string, itemType: string = 'item'): Observable<boolean> {
    return this.confirm({
      title: `Activate ${itemType}`,
      message: `Are you sure you want to activate "${itemName}"?`,
      confirmText: 'Activate',
      cancelText: 'Cancel',
      confirmColor: 'primary',
      icon: 'play_circle',
      iconColor: 'primary'
    });
  }

  confirmAction(title: string, message: string, confirmText: string = 'Confirm'): Observable<boolean> {
    return this.confirm({
      title,
      message,
      confirmText,
      cancelText: 'Cancel',
      confirmColor: 'primary',
      icon: 'help',
      iconColor: 'primary'
    });
  }
}