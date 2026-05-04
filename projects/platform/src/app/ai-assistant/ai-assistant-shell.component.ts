import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AiAssistantService } from './services/ai-assistant.service';
import { AiAssistantApiService } from './services/ai-assistant-api.service';

@Component({
  selector: 'app-ai-assistant-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './ai-assistant-shell.component.html',
  styleUrls: ['./ai-assistant-shell.component.scss'],
  providers: [AiAssistantService, AiAssistantApiService]
})
export class AiAssistantShellComponent {}