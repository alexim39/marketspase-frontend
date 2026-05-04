import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiAssistantService } from '../../services/ai-assistant.service';
import { AnalyticsData } from '../../models/assistant.model';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
})
export class AnalyticsComponent implements OnInit {
  private service = inject(AiAssistantService);
  analytics$!: Observable<AnalyticsData | null>;

  ngOnInit(): void {
    this.service.loadAnalytics();
    this.analytics$ = this.service.analytics$;
  }
}