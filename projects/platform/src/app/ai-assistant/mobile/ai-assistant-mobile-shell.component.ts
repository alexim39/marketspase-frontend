import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AiAssistantComponent } from '../ai-assistant.component';

@Component({
  selector: 'marketspase-ai-assistant-mobile-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './ai-assistant-mobile-shell.component.html',
  styleUrl: './ai-assistant-mobile-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAssistantMobileShellComponent extends AiAssistantComponent {
  protected readonly bottomNavItems = this.navItems;
}
