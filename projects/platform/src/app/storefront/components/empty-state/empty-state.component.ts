// empty-state.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {
  @Input() icon = 'inventory_2';
  @Input() title = 'No Products Found';
  @Input() message = 'This store doesn\'t have any products available at the moment.';
  @Input() showActions = true;
  @Input() actionLabel = 'Browse Marketplace';
  @Input() secondaryActionLabel = 'Clear Filters';
  
  @Output() action = new EventEmitter<void>();
  @Output() secondaryAction = new EventEmitter<void>();
}