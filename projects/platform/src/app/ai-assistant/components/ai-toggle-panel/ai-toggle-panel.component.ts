/* // ai-toggle-panel.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AiAssistantService } from '../../services/ai-assistant.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-ai-toggle-panel',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatSlideToggleModule, RouterModule],
  templateUrl: './ai-toggle-panel.component.html',
  styleUrls: ['./ai-toggle-panel.component.scss']
})
export class AiTogglePanelComponent {
  @Input() aiEnabled!: boolean | false;
  
  constructor(private service: AiAssistantService) {}

  toggleAI(enable: boolean): void {
    this.service.toggleAI(enable);
  }
} */