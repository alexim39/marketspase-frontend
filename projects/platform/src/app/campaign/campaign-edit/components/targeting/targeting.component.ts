// targeting.component.ts
import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-targeting',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatIconModule,
    MatSlideToggleModule
  ],
  templateUrl: './targeting.component.html',
  styleUrls: ['./targeting.component.scss']
})
export class TargetingComponent {
  @Input() enableTarget: boolean = false;
  @Input() targetLocations: string[] = [];
  @Input() locationSuggestions: string[] = [];
  @Input() locationInputControl: FormControl = new FormControl('');
  
  @Output() enableTargetChange = new EventEmitter<boolean>();
  @Output() addLocation = new EventEmitter<string>();
  @Output() removeLocation = new EventEmitter<string>();
  @Output() addLocationFromAutocomplete = new EventEmitter<any>();

  filteredLocationSuggestions = computed(() => {
    const inputValue = this.locationInputControl.value?.toLowerCase() || '';
    return this.locationSuggestions.filter(location => 
      location.toLowerCase().includes(inputValue) && 
      !this.targetLocations.includes(location)
    );
  });
}