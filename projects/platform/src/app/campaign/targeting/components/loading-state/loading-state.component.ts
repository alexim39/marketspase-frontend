// loading-state.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
  templateUrl: './loading-state.component.html',
  styleUrls: ['./loading-state.component.scss']
})
export class LoadingStateComponent {
  @Input() message: string = 'Loading...';
}