import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { filter, map, take, takeUntil } from 'rxjs/operators';
import { UserService } from '../common/services/user.service';
import { SocketService } from './services/socket.service';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive, 
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatBadgeModule
  ],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.scss']
})
export class AiAssistantComponent implements OnInit, OnDestroy {
  private breakpointObserver = inject(BreakpointObserver);
  private userService = inject(UserService);
  private socketService = inject(SocketService);
  private destroy$ = new Subject<void>();
  private user$ = toObservable(this.userService.user);

  isMobile = false;
  sidenavOpened = true;
  unreadCount = 0;

  navItems = [
    { path: 'overview', label: 'Overview', icon: 'dashboard' },
    { path: 'conversations', label: 'Conversations', icon: 'chat', badge: 0 },
    { path: 'faqs', label: 'FAQs', icon: 'help_outline' },
    { path: 'automation', label: 'Automation', icon: 'auto_fix_high' },
    { path: 'analytics', label: 'Analytics', icon: 'analytics' },
    { path: 'settings', label: 'Settings', icon: 'settings' },
  ];

  ngOnInit(): void {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
        this.sidenavOpened = !this.isMobile;
      });

    const userId = this.userService.user()?._id;
    if (userId) {
      this.socketService.connect(userId);
    } else {
      this.user$
        .pipe(
          map(user => user?._id || ''),
          filter((resolvedUserId): resolvedUserId is string => !!resolvedUserId),
          take(1),
          takeUntil(this.destroy$)
        )
        .subscribe(resolvedUserId => this.socketService.connect(resolvedUserId));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.socketService.disconnect();
  }

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }
}
