// header.component.ts
import { Component, signal, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';

interface NavItem {
  label: string;
  route?: string;
  externalLink?: string;
  children?: NavItem[];
  icon?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatToolbarModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  private router = inject(Router);
  
  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);
  openSubMenus = signal<Set<string>>(new Set());

  navItems = signal<NavItem[]>([
    {
      label: 'Platform',
      children: [
        { label: 'Features', route: '/features', icon: 'rocket_launch' },
        { label: 'How It Works', route: '/how-it-works', icon: 'play_circle' },
        { label: 'Pricing', route: '/pricing', icon: 'attach_money' },
        { label: 'Success Stories', route: '/success-stories', icon: 'stars' }
      ]
    },
    {
      label: 'Solutions',
      children: [
        { label: 'For Marketers', route: '/solutions/marketers', icon: 'business' },
        { label: 'For Promoters', route: '/solutions/promoters', icon: 'groups' },
        { label: 'Case Studies', route: '/case-studies', icon: 'analytics' },
        { label: 'API Documentation', externalLink: 'https://docs.marketspase.com', icon: 'code' }
      ]
    },
    {
      label: 'Resources',
      children: [
        { label: 'Help Center', externalLink: 'https://help.marketspase.com', icon: 'help' },
        { label: 'Blog', route: '/blog', icon: 'article' },
        { label: 'Community', route: '/community', icon: 'forum' },
        { label: 'Webinars', route: '/webinars', icon: 'video_library' }
      ]
    },
    {
      label: 'Company',
      children: [
        { label: 'About Us', route: '/about', icon: 'info' },
        { label: 'Careers', route: '/careers', icon: 'work' },
        { label: 'Contact', route: '/contact', icon: 'mail' },
        { label: 'Press Kit', externalLink: '/press-kit', icon: 'newspaper' }
      ]
    }
  ]);

  @HostListener('window:scroll')
  onWindowScroll() {
    const scrollPosition = window.pageYOffset;
    this.isScrolled.set(scrollPosition > 20);
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (window.innerWidth > 1024) {
      this.closeMobileMenu();
    }
  }

  // In header.component.ts
  toggleMobileMenu(): void {
    console.log('Toggle mobile menu clicked, current state:', this.isMobileMenuOpen());
    this.isMobileMenuOpen.set(!this.isMobileMenuOpen());
    if (this.isMobileMenuOpen()) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
    this.openSubMenus.set(new Set());
    document.body.style.overflow = '';
  }

  toggleSubMenu(item: NavItem): void {
    const currentOpenMenus = new Set(this.openSubMenus());
    if (currentOpenMenus.has(item.label)) {
      currentOpenMenus.delete(item.label);
    } else {
      currentOpenMenus.add(item.label);
    }
    this.openSubMenus.set(currentOpenMenus);
  }

  isSubMenuOpen(item: NavItem): boolean {
    return this.openSubMenus().has(item.label);
  }

  navigateTo(item: NavItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    } else if (item.externalLink) {
      window.open(item.externalLink, '_blank');
    }
  }
}