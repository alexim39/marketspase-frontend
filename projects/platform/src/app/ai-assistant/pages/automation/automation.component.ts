import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Observable, Subscription } from 'rxjs';
import { AiAssistantService } from '../../services/ai-assistant.service';
import { AutomationSettings } from '../../models/assistant.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-automation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './automation.component.html',
  styleUrls: ['./automation.component.scss'],
})
export class AutomationComponent implements OnInit, OnDestroy {
  private service = inject(AiAssistantService);
  private fb = inject(FormBuilder);
  automation$!: Observable<AutomationSettings>;
  private sub?: Subscription;

  form = this.fb.group({
    tone: ['friendly'],
    language: ['english'],
    escalateOnKeywords: [true],
    escalateKeywords: [''],
    lowConfidenceFallback: [true],
    autoReplyEnabled: [true],
  });

  ngOnInit(): void {
    this.automation$ = this.service.automationSettings$;
    this.sub = this.automation$.subscribe(settings => {
      if (settings) {
        this.form.patchValue(settings, { emitEvent: false });
      }
    });

    this.form.valueChanges.subscribe(val => {
      this.service.updateAutomationSettings(val as Partial<AutomationSettings>);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}