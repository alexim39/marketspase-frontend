import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mention-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (suggestions().length > 0) {
      <div class="mention-dropdown">
        @for (s of suggestions(); track s.username) {
          <button type="button" class="mention-item" (click)="select.emit(s)">
            <strong>@{{ s.username }}</strong>
            <span>{{ s.displayName }}</span>
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .mention-dropdown { max-height: 180px; overflow-y: auto; background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 -6px 24px rgba(0,0,0,0.1); margin: 0 1rem 0.5rem; }
    .mention-item { display: flex; align-items: center; gap: 0.6rem; width: 100%; padding: 0.65rem 1rem; border: none; background: none; cursor: pointer; text-align: left; font-size: 0.85rem; color: var(--text-primary); border-bottom: 1px solid rgba(var(--primary-rgb), 0.06); }
    .mention-item:last-child { border-bottom: none; }
    .mention-item:hover, .mention-item:focus { background: rgba(var(--primary-rgb), 0.06); }
    .mention-item strong { color: var(--primary-color); }
    .mention-item span { color: var(--text-secondary); font-size: 0.78rem; }
  `],
})
export class MentionDropdownComponent {
  readonly suggestions = input.required<Array<{ username: string; displayName: string }>>();
  readonly select = output<{ username: string; displayName: string }>();
}
