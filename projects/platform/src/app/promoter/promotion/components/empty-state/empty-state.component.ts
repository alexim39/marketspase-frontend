import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
})
export class EmptyStateComponent {
  @Input() message: string = 'No promotions found.';
  @Input() actionText: string = 'View Promotion';
  //@Output() action = new EventEmitter<void>();
  private router = inject(Router);

  onActionClick(): void {
   // this.action.emit();
   this.router.navigate(['/dashboard/campaigns']);
  }
}