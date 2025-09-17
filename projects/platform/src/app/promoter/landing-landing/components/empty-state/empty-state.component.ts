import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <i class="material-icons empty-icon">campaign</i>
      <h3>No campaigns available</h3>
      <p>Check back later for new promotion opportunities</p>
    </div>
  `,
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {}