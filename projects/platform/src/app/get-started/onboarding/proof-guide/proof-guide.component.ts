import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'marketspase-proof-guide',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './proof-guide.component.html',
  styleUrls: ['./proof-guide.component.scss']
})
export class ProofGuideComponent {
  @Output() openGuide = new EventEmitter<void>();
}