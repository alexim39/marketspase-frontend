import { Component, input, output, model, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-message-composer',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, TextFieldModule, MatProgressSpinnerModule],
  template: `
    <footer class="composer composer--chat">
      @if (attachment()) {
        <div class="attachment-preview">
          <mat-icon>{{ attachment()!.kind === 'image' ? 'image' : 'attach_file' }}</mat-icon>
          <span>{{ attachment()!.label }}</span>
          <button type="button" (click)="attachment.set(null)" aria-label="Remove attachment"><mat-icon>close</mat-icon></button>
        </div>
      }
      <div class="composer-row">
        <div class="composer-actions composer-actions--chat">
          <button mat-icon-button type="button" class="composer-action" aria-label="Add emoji" (click)="emojiClick.emit($event)">
            <mat-icon>emoji_emotions</mat-icon>
          </button>
          <button mat-icon-button type="button" class="composer-action" aria-label="Attach file" (click)="fileInput.click()" [disabled]="uploading()">
            @if (uploading()) { <mat-spinner diameter="18"></mat-spinner> } @else { <mat-icon>attach_file</mat-icon> }
          </button>
          <input #fileInput type="file" hidden (change)="onFileSelected($event)" accept="image/*,.pdf,.doc,.docx" />
        </div>
        <mat-form-field appearance="outline" class="composer-field composer-field--chat">
          <textarea matInput rows="1" cdkTextareaAutosize cdkAutosizeMinRows="1" cdkAutosizeMaxRows="6"
            [ngModel]="draftMessage()" (ngModelChange)="onInput($event)"
            (keydown)="onKeydown($event)" [placeholder]="placeholder()"></textarea>
          <button mat-icon-button matSuffix color="primary" type="button"
            [disabled]="(!draftMessage().trim() && !attachment())"
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
    .composer-actions { display: flex; gap: 0.25rem; margin-bottom: 0.25rem; align-items: center; }
    .composer-field { flex: 1; min-width: 0; }
    .attachment-preview { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.75rem; margin-bottom: 0.5rem; background: rgba(var(--primary-rgb), 0.06); border-radius: 8px; font-size: 0.82rem; }
    .attachment-preview span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .attachment-preview button { background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 2px; }
  `],
})
export class MessageComposerComponent {
  readonly draftMessage = model('');
  readonly placeholder = input('Message');
  readonly send = output<void>();
  readonly emojiClick = output<MouseEvent>();
  readonly fileSelected = output<{ file: File; kind: string }>();
  readonly attachment = model<{ url: string; kind: string; label: string } | null>(null);
  readonly uploading = signal(false);

  constructor() {
    effect(() => {
      if (this.attachment()) this.uploading.set(false);
    });
    effect(() => {
      if (this.uploading()) {
        const t = setTimeout(() => this.uploading.set(false), 15000);
        return () => clearTimeout(t);
      }
      return;
    });
  }

  onInput(value: string): void {
    this.draftMessage.set(value);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      this.send.emit();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    this.uploading.set(true);
    this.fileSelected.emit({ file, kind: isImage ? 'image' : 'file' });
    input.value = '';
  }
}
