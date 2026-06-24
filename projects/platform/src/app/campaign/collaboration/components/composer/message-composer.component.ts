import { Component, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TextFieldModule } from '@angular/cdk/text-field';

@Component({
  selector: 'app-message-composer',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, TextFieldModule],
  template: `
    <footer class="composer composer--chat">
      <div class="composer-row">
        <div class="composer-actions composer-actions--chat">
          <button mat-icon-button type="button" class="composer-action" aria-label="Add emoji" (click)="emojiClick.emit($event)">
            <mat-icon>emoji_emotions</mat-icon>
          </button>
        </div>
        <mat-form-field appearance="outline" class="composer-field composer-field--chat">
          <textarea matInput rows="1" cdkTextareaAutosize cdkAutosizeMinRows="1" cdkAutosizeMaxRows="6"
            [ngModel]="draftMessage()" (ngModelChange)="onInput($event)"
            (keydown)="onKeydown($event)" [placeholder]="placeholder()"></textarea>
          <button mat-icon-button matSuffix color="primary" type="button"
            [disabled]="!draftMessage().trim()"
            (click)="send.emit()" aria-label="Send message">
            <mat-icon>send</mat-icon>
          </button>
        </mat-form-field>
      </div>
    </footer>
  `,
  styles: [`
    .composer { padding: 1rem 1rem 0.85rem; }
    .composer-row { display: flex; align-items: flex-end; gap: 0.5rem; }
    .composer-actions { display: flex; gap: 0.25rem; margin-bottom: 0.25rem; }
    .composer-field { flex: 1; min-width: 0; }
  `],
})
export class MessageComposerComponent {
  readonly draftMessage = model('');
  readonly placeholder = input('Message');
  readonly send = output<void>();
  readonly emojiClick = output<MouseEvent>();

  onInput(value: string): void {
    this.draftMessage.set(value);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      this.send.emit();
    }
  }
}
