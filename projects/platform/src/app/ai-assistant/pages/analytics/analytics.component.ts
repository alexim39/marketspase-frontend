import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { AiAssistantService } from '../../services/ai-assistant.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
  providers: [AiAssistantService]
})
export class AnalyticsComponent implements OnInit {
  private aiService = inject(AiAssistantService);
  stats: any = {};

  ngOnInit(): void {
    this.aiService.getStats().subscribe({ next: (res) => this.stats = res.data });
  }
}