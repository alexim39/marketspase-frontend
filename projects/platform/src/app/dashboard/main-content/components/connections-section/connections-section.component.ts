// connections-section.component.ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface SuggestedConnection {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  completed: number;
  mutualConnections?: number;
  skills?: string[];
  location?: string;
  status?: 'online' | 'offline' | 'away';
}

@Component({
  selector: 'connections-section',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule
  ],
  templateUrl: './connections-section.component.html',
  styleUrls: ['./connections-section.component.scss']
})
export class ConnectionsSectionComponent {
  connections = input<SuggestedConnection[]>([]);
  pendingConnections = input<Set<string>>(new Set());
  connectedConnections = input<Set<string>>(new Set());
  filters = input<string[]>(['All', 'Marketers', 'Promoters', 'Top Rated']);
  activeFilter = input<string>('All');

  viewAll = output<void>();
  connect = output<string>();
  message = output<string>();
  profileClick = output<SuggestedConnection>();
  filterChange = output<string>();
  refresh = output<void>();

  filteredConnections = () => {
    const items = this.connections();
    const filter = this.activeFilter();
    
    if (filter === 'All') return items;
    if (filter === 'Marketers') return items.filter(c => c.role.toLowerCase().includes('marketer'));
    if (filter === 'Promoters') return items.filter(c => c.role.toLowerCase().includes('promoter'));
    if (filter === 'Top Rated') return items.filter(c => c.rating >= 4.5);
    return items;
  }

  totalConnections = () => {
    return this.filteredConnections().length;
  }

  mutualConnections = () => {
    return this.filteredConnections()
      .reduce((sum, c) => sum + (c.mutualConnections || 0), 0);
  }

  onlineCount = () => {
    return this.filteredConnections()
      .filter(c => c.status === 'online').length;
  }

  isPending(connectionId: string): boolean {
    return this.pendingConnections().has(connectionId);
  }

  isConnected(connectionId: string): boolean {
    return this.connectedConnections().has(connectionId);
  }

  onConnect(connectionId: string): void {
    this.connect.emit(connectionId);
  }

  onMessage(connectionId: string): void {
    this.message.emit(connectionId);
  }

  onProfileClick(connection: SuggestedConnection): void {
    this.profileClick.emit(connection);
  }
}