// profile-skeleton.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-profile-skeleton',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="profile-skeleton-container">
      <!-- Profile Header Skeleton -->
      <div class="profile-header-skeleton">
        <div class="profile-cover-skeleton"></div>
        <div class="profile-info-skeleton">
          <div class="profile-avatar-skeleton shimmer"></div>
          <div class="profile-details-skeleton">
            <div class="name-row-skeleton">
              <div class="name-skeleton shimmer"></div>
              <div class="badge-skeleton shimmer"></div>
            </div>
            <div class="username-skeleton shimmer"></div>
            <div class="bio-skeleton shimmer"></div>
            
            <!-- Meta Row Skeleton -->
            <div class="meta-row-skeleton">
              <div class="meta-item-skeleton shimmer"></div>
              <div class="meta-item-skeleton shimmer"></div>
              <div class="meta-item-skeleton shimmer"></div>
            </div>
            
            <!-- Stats Row Skeleton -->
            <div class="stats-row-skeleton">
              <div class="stat-skeleton">
                <div class="stat-value-skeleton shimmer"></div>
                <div class="stat-label-skeleton shimmer"></div>
              </div>
              <div class="stat-skeleton">
                <div class="stat-value-skeleton shimmer"></div>
                <div class="stat-label-skeleton shimmer"></div>
              </div>
              <div class="stat-skeleton">
                <div class="stat-value-skeleton shimmer"></div>
                <div class="stat-label-skeleton shimmer"></div>
              </div>
              <div class="stat-skeleton">
                <div class="stat-value-skeleton shimmer"></div>
                <div class="stat-label-skeleton shimmer"></div>
              </div>
            </div>
            
            <!-- Action Row Skeleton -->
            <div class="action-row-skeleton">
              <div class="button-skeleton shimmer"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs Skeleton -->
      <div class="tabs-skeleton">
        <div class="tab-bar-skeleton">
          <div class="tab-skeleton shimmer"></div>
          <div class="tab-skeleton shimmer"></div>
          <div class="tab-skeleton shimmer"></div>
        </div>
        
        <!-- Tab Content Skeleton (Posts view by default) -->
        <div class="tab-content-skeleton">
          <!-- Post Cards Skeleton -->
          @for (item of [1,2,3]; track item) {
            <div class="post-card-skeleton">
              <div class="post-header-skeleton">
                <div class="post-avatar-skeleton shimmer"></div>
                <div class="post-author-skeleton">
                  <div class="author-name-skeleton shimmer"></div>
                  <div class="post-time-skeleton shimmer"></div>
                </div>
              </div>
              <div class="post-content-skeleton">
                <div class="content-line-skeleton shimmer"></div>
                <div class="content-line-skeleton short shimmer"></div>
              </div>
              <div class="post-actions-skeleton">
                <div class="action-skeleton shimmer"></div>
                <div class="action-skeleton shimmer"></div>
                <div class="action-skeleton shimmer"></div>
                <div class="action-skeleton shimmer"></div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./profile-skeleton.component.scss']
})
export class ProfileSkeletonComponent {}