// components/loading-state/loading-state.component.ts
import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-state.component.html',
  styleUrls: ['./loading-state.component.scss']
})
export class LoadingStateComponent {
  // Optional: Different loading variants for different contexts
  variant = input<'grid' | 'table' | 'summary'>('grid');
  itemCount = input<number>(6);
}