import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AiAssistantService } from '../../services/ai-assistant.service';
import { Stats, Conversation } from '../../models/assistant.model';
import { DashboardCardsComponent } from '../../components/dashboard-cards/dashboard-cards.component';
import { AiTogglePanelComponent } from '../../components/ai-toggle-panel/ai-toggle-panel.component';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    DashboardCardsComponent,
    AiTogglePanelComponent,
    MatCardModule,
    MatListModule,
    MatIconModule,
    RouterModule,
    MatButtonModule
  ],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent implements OnInit {
  private service = inject(AiAssistantService);

  stats$!: Observable<Stats>;
  aiEnabled$ = this.service.aiEnabled$;
  conversations$!: Observable<Conversation[]>;

  ngOnInit(): void {
    this.stats$ = this.service.stats$;
    this.conversations$ = this.service.conversations$;
  }

  openConversation(id: string) {
    // Navigate to conversation details page
  }
}