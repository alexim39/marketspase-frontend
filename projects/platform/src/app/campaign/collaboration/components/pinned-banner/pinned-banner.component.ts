import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-pinned-banner',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="pinned-banner">
      <mat-icon>push_pin</mat-icon>
      <div class="pinned-content">
        @for (msg of messages(); track msg._id) {
          <div class="pinned-item">
            <strong>{{ msg.sender?.displayName || 'Someone' }}</strong>
            <span>{{ msg.content }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .pinned-banner { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.65rem 1rem; background: rgba(var(--primary-rgb), 0.06); border-bottom: 1px solid rgba(var(--primary-rgb), 0.1); }
    .pinned-banner > mat-icon { color: var(--primary-color); width: 18px; height: 18px; font-size: 18px; flex-shrink: 0; margin-top: 0.1rem; }
    .pinned-content { flex: 1; min-width: 0; }
    .pinned-item { display: flex; gap: 0.4rem; font-size: 0.8rem; line-height: 1.4; color: var(--text-secondary); }
    .pinned-item strong { color: var(--text-primary); white-space: nowrap; }
    .pinned-item span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  `],
})
export class PinnedBannerComponent {
  readonly messages = input.required<any[]>();
}
