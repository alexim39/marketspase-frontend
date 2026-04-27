// stores-header.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stores-header',  // Fixed selector to match usage
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './stores-header.component.html',
  styleUrls: ['./stores-header.component.scss']
})
export class StoresHeaderComponent {
  @Input() stats!: { total: number; verified: number; categories: number; premiumStores: number };
  @Input() searchControl!: FormControl;
}