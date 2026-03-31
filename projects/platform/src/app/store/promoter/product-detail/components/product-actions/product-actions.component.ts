import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-product-actions',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './product-actions.component.html',
  styleUrls:['./product-actions.component.scss']
})
export class ProductActionsComponent {
  @Output() copyLink = new EventEmitter<void>();
  @Output() shareWhatsApp = new EventEmitter<void>();
}