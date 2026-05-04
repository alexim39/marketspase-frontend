import { Component, inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AiAssistantService } from '../../services/ai-assistant.service';
import { FAQ } from '../../models/assistant.model';
import { FaqManagerComponent } from '../../components/faq-manager/faq-manager.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faqs',
  standalone: true,
  imports: [CommonModule, FaqManagerComponent],
  templateUrl: './faqs.component.html',
  styleUrls: ['./faqs.component.scss'],
})
export class FaqsComponent implements OnInit {
  private service = inject(AiAssistantService);
  faqs$!: Observable<FAQ[]>;

  ngOnInit(): void {
    this.faqs$ = this.service.faqs$;
  }
}