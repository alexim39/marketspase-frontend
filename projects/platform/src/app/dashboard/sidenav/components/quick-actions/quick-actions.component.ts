import { Component, Input, Output, EventEmitter, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserInterface } from '../../../../../../../shared-services/src/public-api';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './quick-actions.component.html',
  styleUrls: ['./quick-actions.component.scss']
})
export class QuickActionsComponent {
  @Input({ required: true }) user!: Signal<UserInterface | null>;
  @Output() createCampaign = new EventEmitter<void>();
  @Output() fundWallet = new EventEmitter<void>();
  @Output() switchUser = new EventEmitter<string>();
  @Output() viewPromotion = new EventEmitter<void>();
  @Output() viewMyPromotion = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() mobileAction = new EventEmitter<void>();
}