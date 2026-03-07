// campaign-edit-header.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-targeting-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './targeting-header.component.html',
  styleUrls: ['./targeting-header.component.scss']
})
export class CampaignTargetingHeaderComponent {
  @Input() isFormValid: boolean = false;
  @Input() isSaving: boolean = false;
  
  @Output() goBack = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
}