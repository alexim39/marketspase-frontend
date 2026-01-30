// store-footer.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { Store } from '../../../store/models';

@Component({
  selector: 'app-store-footer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './store-footer.component.html',
  styleUrls: ['./store-footer.component.scss']
})
export class StoreFooterComponent {
  @Input() store: Store | null = null;
  @Input() currentYear = new Date().getFullYear();
  
  @Output() contactViaWhatsApp = new EventEmitter<void>();

  onContactViaWhatsApp(): void {
    this.contactViaWhatsApp.emit();
  }
}