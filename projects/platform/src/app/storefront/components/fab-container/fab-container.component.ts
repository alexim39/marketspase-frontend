// fab-container.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-fab-container',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatBadgeModule, RouterModule],
  templateUrl: './fab-container.component.html',
  styleUrls: ['./fab-container.component.scss']
})
export class FabContainerComponent {
  @Input() isScrolled = false;
  @Input() cartCount = 0;
  
  @Output() scrollToTop = new EventEmitter<void>();
  @Output() shareStore = new EventEmitter<void>();
}