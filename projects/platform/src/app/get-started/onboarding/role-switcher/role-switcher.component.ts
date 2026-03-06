import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';

@Component({
  selector: 'marketspase-role-switcher',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatChipsModule, MatRippleModule],
  templateUrl: './role-switcher.component.html',
  styleUrls: ['./role-switcher.component.scss']
})
export class RoleSwitcherComponent {
  @Input() isMarketer: boolean = false;
  @Input() isPromoter: boolean = false;
  @Output() switchRole = new EventEmitter<'marketer' | 'promoter'>();

  onSwitch(role: 'marketer' | 'promoter') {
    this.switchRole.emit(role);
  }
}