import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface PromotionPost {
  id: string;
  title: string;
  advertiser: string;
  budget: number;
  rate: number;
  totalSlots: number;
  filledSlots: number;
  status: 'active' | 'completed' | 'pending' | 'paused';
  createdDate: string;
  category: string;
  engagement: number;
}

interface StatusPromotion {
  id: string;
  postTitle: string;
  promoter: string;
  promoterPhone: string;
  views: number;
  requiredViews: number;
  postedTime: string;
  expiresIn: string;
  status: 'active' | 'expired' | 'verified' | 'failed';
  payment: number;
}

@Component({
  selector: 'app-dashboard-main',
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <!-- Dashboard Content -->
    <main class="dashboard-content">
      <!-- Stats Overview -->
      <section class="stats-section">
        <div class="stats-grid">
          <div class="stat-card primary">
            <div class="stat-icon">
              <mat-icon>analytics</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">Active Promotions</div>
              <div class="stat-value">{{ activePromotions() }}</div>
              <div class="stat-change positive">
                <mat-icon>trending_up</mat-icon>
                +{{ activePromotionsChange() }}% this week
              </div>
            </div>
          </div>
          
          <div class="stat-card success">
            <div class="stat-icon">
              <mat-icon>attach_money</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">Total Revenue</div>
              <div class="stat-value">₦{{ totalRevenue().toLocaleString() }}</div>
              <div class="stat-change positive">
                <mat-icon>trending_up</mat-icon>
                +{{ revenueChange() }}% this month
              </div>
            </div>
          </div>
          
          <div class="stat-card info">
            <div class="stat-icon">
              <mat-icon>group</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">Active Promoters</div>
              <div class="stat-value">{{ activePromoters() }}</div>
              <div class="stat-change positive">
                <mat-icon>trending_up</mat-icon>
                +{{ promotersChange() }}% this month
              </div>
            </div>
          </div>
          
          <div class="stat-card warning">
            <div class="stat-icon">
             <mat-icon>vital_signs</mat-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">Avg. Engagement</div>
              <div class="stat-value">{{ averageEngagement() }}%</div>
              <div class="stat-change negative">
               <mat-icon>trending_down</mat-icon>
                {{ Math.abs(engagementChange()) }}% from last week
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <!-- Recent Promotion Posts -->
      <section class="dashboard-section">
        <div class="section-header">
          <h2 class="section-title">Recent Promotion Posts</h2>
          <button class="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add New Post
          </button>
        </div>
        
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Post Details</th>
                <th>Budget & Rate</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let post of filteredPosts()">
                <td>
                  <div class="post-info">
                    <div class="post-title">{{ post.title }}</div>
                    <div class="post-meta">
                      <span class="advertiser">{{ post.advertiser }}</span>
                      <span class="category">{{ post.category }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="budget-info">
                    <div class="budget">₦{{ post.budget.toLocaleString() }}</div>
                    <div class="rate">₦{{ post.rate }}/promotion</div>
                  </div>
                </td>
                <td>
                  <div class="progress-info">
                    <div class="progress-bar">
                      <div 
                        class="progress-fill" 
                        [style.width.%]="(post.filledSlots / post.totalSlots) * 100">
                      </div>
                    </div>
                    <div class="progress-text">{{ post.filledSlots }}/{{ post.totalSlots }} slots</div>
                  </div>
                </td>
                <td>
                  <span 
                    class="status-badge" 
                    [class]="'status-' + post.status">
                    {{ post.status | titlecase }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-icon" (click)="viewPost(post)" title="View Details">
                     <mat-icon>visibility</mat-icon>
                    </button>
                    <button class="btn-icon" (click)="editPost(post)" title="Edit">
                     <mat-icon>edit</mat-icon>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      
      <!-- Active Status Promotions -->
      <section class="dashboard-section">
        <div class="section-header">
          <h2 class="section-title">Active Status Promotions</h2>
          <button class="btn btn-secondary">View All</button>
        </div>
        
        <div class="status-grid">
          <div 
            *ngFor="let status of filteredStatusPromotions()" 
            class="status-card"
            [class]="'status-' + status.status">
            <div class="status-header">
              <div class="status-title">{{ status.postTitle }}</div>
              <div class="status-badge" [class]="'badge-' + status.status">
                {{ status.status | titlecase }}
              </div>
            </div>
            
            <div class="status-promoter">
             <mat-icon>account_box</mat-icon>
              {{ status.promoter }}
            </div>
            
            <div class="status-metrics">
              <div class="metric">
                <div class="metric-label">Views</div>
                <div class="metric-value">{{ status.views }}/{{ status.requiredViews }}</div>
              </div>
              <div class="metric">
                <div class="metric-label">Payment</div>
                <div class="metric-value">₦{{ status.payment }}</div>
              </div>
            </div>
            
            <div class="status-time">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              Expires {{ status.expiresIn }}
            </div>
          </div>
        </div>
      </section>
    </main>
  `,
  styles: [`
   * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: #f9fafb;
  color: #111827;
  line-height: 1.6;
}

/* Dashboard Content */
.dashboard-content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

/* Stats Section */
.stats-section {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.stat-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.stat-card.primary .stat-icon {
  background: linear-gradient(135deg, #667eea, #818cf8);
}

.stat-card.success .stat-icon {
  background: linear-gradient(135deg, #10b981, #34d399);
}

.stat-card.info .stat-icon {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
}

.stat-card.warning .stat-icon {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.stat-change {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.stat-change.positive {
  color: #10b981;
}

.stat-change.negative {
  color: #ef4444;
}

/* Dashboard Sections */
.dashboard-section {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  margin-bottom: 32px;
  overflow: hidden;
}

.section-header {
  padding: 24px 24px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary {
  background: #667eea;
  color: #ffffff;
}

.btn-primary:hover {
  background: #5a67d8;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

/* Data Table */
.data-table-container {
  overflow-x: auto;
  padding: 0 24px 24px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 16px 12px;
  font-weight: 600;
  font-size: 14px;
  color: #4b5563;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #f3f4f6;
}

.data-table tr:hover {
  background: #f9fafb;
}

.post-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.post-title {
  font-weight: 600;
  color: #111827;
}

.post-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.advertiser {
  color: #4b5563;
}

.category {
  background: #f3f4f6;
  color: #374151;
  padding: 2px 8px;
  border-radius: 12px;
}

.budget-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.budget {
  font-weight: 600;
  color: #111827;
}

.rate {
  font-size: 12px;
  color: #4b5563;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  width: 100px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #818cf8);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #4b5563;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-completed {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.status-pending {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.status-paused {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-icon:hover {
  background: #f3f4f6;
  color: #374151;
}

/* Status Grid */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding: 0 24px 24px;
}

.status-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.status-card:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  transform: translateY(-2px);
}

.status-card.status-active {
  border-left: 4px solid #10b981;
}

.status-card.status-expired {
  border-left: 4px solid #9ca3af;
}

.status-card.status-verified {
  border-left: 4px solid #3b82f6;
}

.status-card.status-failed {
  border-left: 4px solid #ef4444;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

.status-title {
  font-weight: 600;
  color: #111827;
  flex: 1;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.badge-active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.badge-expired {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.badge-verified {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.badge-failed {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.status-promoter {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 16px;
}

.status-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.metric {
  text-align: center;
}

.metric-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.status-time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .status-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard-content {
    padding: 20px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .status-grid {
    grid-template-columns: 1fr;
  }
  
  .data-table-container {
    padding: 0 16px 16px;
  }
  
  .section-header {
    padding: 16px 16px 0;
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
}

@media (max-width: 480px) {
  .dashboard-content {
    padding: 16px;
  }
  
  .data-table th,
  .data-table td {
    padding: 12px 8px;
    font-size: 12px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
  `]
})
export class DashboardMainComponent implements OnInit {
  // Stats
  activePromotions = signal(124);
  activePromotionsChange = signal(15.3);
  totalRevenue = signal(2450000);
  revenueChange = signal(22.5);
  activePromoters = signal(847);
  promotersChange = signal(8.2);
  averageEngagement = signal(78.5);
  engagementChange = signal(-2.1);
  
  // Data
  promotionPosts: PromotionPost[] = [
    {
      id: 'POST-001',
      title: 'Nike Air Max Summer Collection Launch',
      advertiser: 'Nike Nigeria',
      budget: 150000,
      rate: 500,
      totalSlots: 300,
      filledSlots: 245,
      status: 'active',
      createdDate: '2025-08-28',
      category: 'Fashion',
      engagement: 85.2
    },
    {
      id: 'POST-002',
      title: 'Tecno Phantom X2 Pro Giveaway',
      advertiser: 'Tecno Mobile',
      budget: 200000,
      rate: 400,
      totalSlots: 500,
      filledSlots: 320,
      status: 'active',
      createdDate: '2025-08-27',
      category: 'Technology',
      engagement: 92.1
    },
    {
      id: 'POST-003',
      title: 'Dominos Pizza Weekend Special',
      advertiser: 'Dominos Pizza',
      budget: 75000,
      rate: 300,
      totalSlots: 250,
      filledSlots: 250,
      status: 'completed',
      createdDate: '2025-08-25',
      category: 'Food',
      engagement: 76.8
    },
    {
      id: 'POST-004',
      title: 'Jumia Black Friday Preview',
      advertiser: 'Jumia Nigeria',
      budget: 300000,
      rate: 600,
      totalSlots: 500,
      filledSlots: 0,
      status: 'pending',
      createdDate: '2025-08-30',
      category: 'E-commerce',
      engagement: 0
    },
    {
      id: 'POST-005',
      title: 'Spotify Premium 3-Month Free',
      advertiser: 'Spotify',
      budget: 120000,
      rate: 450,
      totalSlots: 267,
      filledSlots: 156,
      status: 'paused',
      createdDate: '2025-08-26',
      category: 'Entertainment',
      engagement: 68.4
    }
  ];
  
  statusPromotions: StatusPromotion[] = [
    {
      id: 'STATUS-001',
      postTitle: 'Nike Air Max Summer Collection',
      promoter: 'Sarah Johnson',
      promoterPhone: '+234 803 XXX 5678',
      views: 32,
      requiredViews: 25,
      postedTime: '14:30',
      expiresIn: '9h 30m',
      status: 'verified',
      payment: 500
    },
    {
      id: 'STATUS-002',
      postTitle: 'Tecno Phantom X2 Pro Giveaway',
      promoter: 'Michael Chen',
      promoterPhone: '+234 701 XXX 9012',
      views: 18,
      requiredViews: 25,
      postedTime: '16:45',
      expiresIn: '7h 15m',
      status: 'active',
      payment: 400
    },
    {
      id: 'STATUS-003',
      postTitle: 'Dominos Pizza Weekend Special',
      promoter: 'Amina Ibrahim',
      promoterPhone: '+234 902 XXX 3456',
      views: 42,
      requiredViews: 25,
      postedTime: '12:20',
      expiresIn: 'Expired',
      status: 'verified',
      payment: 300
    },
    {
      id: 'STATUS-004',
      postTitle: 'Spotify Premium Offer',
      promoter: 'David Okafor',
      promoterPhone: '+234 805 XXX 7890',
      views: 12,
      requiredViews: 25,
      postedTime: '13:15',
      expiresIn: 'Expired',
      status: 'failed',
      payment: 450
    },
    {
      id: 'STATUS-005',
      postTitle: 'Nike Air Max Summer Collection',
      promoter: 'Grace Adebayo',
      promoterPhone: '+234 703 XXX 2345',
      views: 28,
      requiredViews: 25,
      postedTime: '15:30',
      expiresIn: '8h 30m',
      status: 'active',
      payment: 500
    },
    {
      id: 'STATUS-006',
      postTitle: 'Tecno Phantom X2 Pro Giveaway',
      promoter: 'Chinedu Okwu',
      promoterPhone: '+234 806 XXX 6789',
      views: 35,
      requiredViews: 25,
      postedTime: '11:45',
      expiresIn: 'Expired',
      status: 'verified',
      payment: 400
    }
  ];
  
  // Computed filtered data
  filteredPosts = computed(() => {
    return this.promotionPosts;
  });
  
  filteredStatusPromotions = computed(() => {
    return this.statusPromotions;
  });
  
  // Expose Math to template
  Math = Math;

  ngOnInit() {
    // Initialize any required data or subscriptions
  }
  
  // Action methods
  viewPost(post: PromotionPost) {
    console.log('Viewing post:', post);
  }
  
  editPost(post: PromotionPost) {
    console.log('Editing post:', post);
  }
}