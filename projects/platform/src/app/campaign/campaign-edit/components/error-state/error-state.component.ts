// error-state.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './error-state.component.html',
  styleUrls: ['./error-state.component.scss']
})
export class ErrorStateComponent {
  @Input() error: string = 'An error occurred';
  @Output() retry = new EventEmitter<void>();
}