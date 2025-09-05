import { Component, OnInit, OnDestroy, inject, signal, Signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, Subscription } from 'rxjs';
import { UserInterface } from '../../../../../../shared-services/src/public-api';


// Interfaces
export interface Campaign {
  id: string;
  title: string;
  description: string;
  budget: number;
  spent: number;
  reach: number;
  status: 'active' | 'pending' | 'completed' | 'paused';
  deadline: Date;
  imageUrl: string;
  promoters: number;
  viewsRequired: number;
  currentViews: number;
}

@Component({
  selector: 'advertiser-tab',
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatGridListModule,
    MatMenuModule,
    MatBadgeModule,
    MatChipsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTableModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './advertiser-tab.component.html',
  styleUrls: ['./advertiser-tab.component.scss'],
})
export class AdvertiserTabComponent {
  private router = inject(Router);

  //readonly user = input.required<UserInterface | null>();
  @Input({ required: true }) user!: Signal<UserInterface | null>;

  campaigns = signal<Campaign[]>([
    {
      id: '1',
      title: 'Summer Fashion Collection',
      description: 'Promote our latest summer fashion collection with vibrant designs',
      budget: 50000,
      spent: 32000,
      reach: 15000,
      status: 'active',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      promoters: 20,
      viewsRequired: 25000,
      currentViews: 15000
    },
    {
      id: '2',
      title: 'Tech Gadget Launch',
      description: 'Launch announcement for our revolutionary smart device',
      budget: 75000,
      spent: 45000,
      reach: 22000,
      status: 'active',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400',
      promoters: 30,
      viewsRequired: 35000,
      currentViews: 22000
    }
  ]);

  // Campaign Actions
  createCampaign(): void {
    this.router.navigate(['dashboard/campaigns/create']);
  }

  viewCampaign(campaignId: string): void {
    this.router.navigate(['/campaign', campaignId]);
  }

  viewProofs(campaignId: string): void {
    this.router.navigate(['/campaign', campaignId, 'proofs']);
  }

}