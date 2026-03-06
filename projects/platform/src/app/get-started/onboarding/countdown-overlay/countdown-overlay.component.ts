import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {MatProgressBarModule} from '@angular/material/progress-bar';
@Component({
  selector: 'marketspase-countdown-overlay',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './countdown-overlay.component.html',
  styleUrls: ['./countdown-overlay.component.scss']
})
export class CountdownOverlayComponent {
  @Input() seconds: number = 0;
  @Output() cancel = new EventEmitter<void>();
  @Output() reload = new EventEmitter<void>();

  get displaySeconds(): number {
    return this.seconds;
  }
}