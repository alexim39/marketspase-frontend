// components/no-results-state/no-results-state.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-no-results-state',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './no-results-state.component.html',
  styleUrls: ['./no-results-state.component.scss']
})
export class NoResultsStateComponent {}