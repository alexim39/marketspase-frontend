// stores-header.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-promoter-stores-header',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="stores-header">
      <div class="header-content">
        <div class="title-section">
          <h1>Discover Stores</h1>
          <p class="subtitle">Find the best stores to partner with and start earning commissions</p>
        </div>
        
        <div class="stats-section">
          <div class="stat-card">
            <mat-icon>store</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ stats.total | number }}</span>
              <span class="stat-label">Total Stores</span>
            </div>
          </div>
          <div class="stat-card">
            <mat-icon>verified</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ stats.verified | number }}</span>
              <span class="stat-label">Verified</span>
            </div>
          </div>
          <div class="stat-card">
            <mat-icon>category</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ stats.categories }}</span>
              <span class="stat-label">Categories</span>
            </div>
          </div>
          <div class="stat-card">
            <mat-icon>star</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ stats.premiumStores }}</span>
              <span class="stat-label">Premium</span>
            </div>
          </div>
        </div>
        
        <div class="search-section">
          <mat-icon class="search-icon">search</mat-icon>
          <input
            [formControl]="searchControl"
            type="text"
            placeholder="Search stores by name, description, or store link..."
            class="search-input"
          />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stores-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      
      .header-content {
        max-width: 1400px;
        margin: 0 auto;
      }
      
      .title-section {
        text-align: center;
        margin-bottom: 2rem;
        
        h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
        }
        
        .subtitle {
          font-size: 1rem;
          opacity: 0.9;
          margin: 0;
        }
      }
      
      .stats-section {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
        
        .stat-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          
          mat-icon {
            font-size: 2rem;
            width: 2rem;
            height: 2rem;
          }
          
          .stat-info {
            display: flex;
            flex-direction: column;
            
            .stat-value {
              font-size: 1.5rem;
              font-weight: 700;
            }
            
            .stat-label {
              font-size: 0.75rem;
              opacity: 0.8;
            }
          }
        }
      }
      
      .search-section {
        position: relative;
        
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }
        
        .search-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          background: white;
          color: #1f2937;
          
          &:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
          }
          
          &::placeholder {
            color: #9ca3af;
          }
        }
      }
    }
    
    @media (max-width: 768px) {
      .stores-header {
        padding: 1rem;
        
        .title-section h1 {
          font-size: 1.5rem;
        }
        
        .stats-section {
          grid-template-columns: repeat(2, 1fr);
          
          .stat-card {
            padding: 0.75rem;
            
            mat-icon {
              font-size: 1.5rem;
              width: 1.5rem;
              height: 1.5rem;
            }
            
            .stat-value {
              font-size: 1rem;
            }
          }
        }
      }
    }
  `]
})
export class PromoterStoresHeaderComponent {
  @Input() stats!: { total: number; verified: number; categories: number; premiumStores: number };
  @Input() searchControl!: FormControl;
}