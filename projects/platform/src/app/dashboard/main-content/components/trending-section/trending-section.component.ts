// trending-section.component.ts
import { Component, input, output, computed } from '@angular/core'; // Added computed
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface TrendingItem {
  id: string;
  rank: number;
  title: string;
  description: string;
  mentions: number;
  category?: string;
  trend?: 'up' | 'down' | 'new';
}

@Component({
  selector: 'trending-section',
  standalone: true, // Ensure standalone if using with modern Angular
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule
  ],
  templateUrl: './trending-section.component.html',
  styleUrls: ['./trending-section.component.scss']
})
export class TrendingSectionComponent {
  trendingItems = input<TrendingItem[]>([]);
  following = input<Set<string>>(new Set());
  categories = input<string[]>([]);
  activeCategory = input<string>('All');

  viewAll = output<void>();
  trendClick = output<TrendingItem>();
  follow = output<string>();
  categoryChange = output<string>();

  // Use computed for filtering to improve performance
  filteredTrends = computed(() => {
    const items = this.trendingItems();
    const activeCat = this.activeCategory();
    if (activeCat === 'All') return items;
    return items.filter(item => item.category === activeCat);
  });

  totalMentions = computed(() => {
    return this.filteredTrends().reduce((sum, item) => sum + item.mentions, 0);
  });

  // FIXED: Computed memoizes the random value so it doesn't change during Angular's check
  trendingGrowth = computed(() => {
    return Math.floor(Math.random() * 30) + 10;
  });

  // FIXED: Computed memoizes the random value
  uniqueUsers = computed(() => {
    return Math.floor(Math.random() * 1000) + 500;
  });

  topCategory = computed(() => {
    const items = this.filteredTrends();
    if (items.length === 0) return 'N/A';
    
    const categoryCounts = items.reduce((acc, item) => {
      acc[item.category || 'Other'] = (acc[item.category || 'Other'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
  });

  isFollowing(trendId: string): boolean {
    return this.following().has(trendId);
  }

  onTrendClick(trend: TrendingItem): void {
    this.trendClick.emit(trend);
  }

  onFollowTrend(trendId: string): void {
    this.follow.emit(trendId);
  }
}
