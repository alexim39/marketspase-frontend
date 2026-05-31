import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

interface LegalNavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-legal-mobile-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './legal-mobile-shell.component.html',
  styleUrls: ['./legal-mobile-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalMobileShellComponent {
  protected readonly navItems: LegalNavItem[] = [
    { icon: 'gavel', label: 'Terms', route: '/legal/terms' },
    { icon: 'privacy_tip', label: 'Privacy', route: '/legal/privacy' },
    { icon: 'cookie', label: 'Cookies', route: '/legal/cookies' },
  ];
}
