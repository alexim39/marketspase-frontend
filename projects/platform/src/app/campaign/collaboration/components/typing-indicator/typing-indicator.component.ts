import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-typing-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (text()) {
      <div class="typing-indicator" aria-live="polite">
        <span class="typing-dots"><span></span><span></span><span></span></span>
        <em>{{ text() }}</em>
      </div>
    }
  `,
  styles: [`
    .typing-indicator { display: flex; align-items: center; gap: 0.5rem; padding: 0.3rem 1rem; font-size: 0.8rem; color: var(--text-secondary); animation: fadeIn 0.2s ease; }
    .typing-indicator em { font-style: italic; }
    .typing-dots { display: flex; gap: 3px; }
    .typing-dots span { width: 6px; height: 6px; border-radius: 50%; background: var(--primary-color); animation: typingBounce 1.2s infinite ease-in-out; }
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-4px); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  `],
})
export class TypingIndicatorComponent {
  readonly text = input('');
}
