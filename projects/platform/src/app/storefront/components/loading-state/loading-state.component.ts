// loading-state.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './loading-state.component.html',
  styleUrls: ['./loading-state.component.scss']
})
export class LoadingStateComponent {
  @Input() message = 'Loading store products...';
  @Input() subMessage = 'Preparing your shopping experience';
}