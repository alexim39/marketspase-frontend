// targeting.component.ts (REFACTORED - LOCATION TARGETING ONLY)
import { Component, Input, Output, EventEmitter, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TargetingArea, TargetingSettings } from '../../../../../../../shared-services/src/public-api';

declare const google: any;

@Component({
  selector: 'app-targeting',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatTooltipModule,
    MatRadioModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './targeting.component.html',
  styleUrls: ['./targeting.component.scss'] 
})
export class TargetingComponent implements AfterViewInit, OnInit, OnChanges {
  @Input() enableTarget: boolean = false;
  @Input() targetLocations: TargetingArea[] = [];
  
  locationInputControl: FormControl = new FormControl('');
  
  @Output() enableTargetChange = new EventEmitter<boolean>();
  @Output() addLocation = new EventEmitter<TargetingArea>();
  @Output() removeLocation = new EventEmitter<string>();
  @Output() targetingSettingsChange = new EventEmitter<TargetingSettings>();

  @ViewChild('locationInput', { static: false }) locationInput!: ElementRef;

  private snackBar = inject(MatSnackBar);

  readonly precisionLevels = [
    { value: 'high', label: 'High Precision (Address)', description: 'Target specific addresses, businesses, or points of interest.' },
    { value: 'medium', label: 'Medium Precision (Locality)', description: 'Target neighborhoods, cities, or postal codes.' },
    { value: 'low', label: 'Low Precision (Country)', description: 'Target countries or large administrative areas.' }
  ];

  currentPrecision: 'high' | 'medium' | 'low' = 'medium';
  private autocomplete: any;
  private isGoogleMapsLoaded: boolean = false;
  private lastSelectedPlace: any = null;

  ngOnInit(): void {
    this.checkGoogleMapsLoaded();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['targetLocations'] || changes['enableTarget']) {
      this.emitSettings();
    }
  }

  ngAfterViewInit(): void {
    if (this.enableTarget && this.isGoogleMapsLoaded) {
      setTimeout(() => this.initAutocomplete(), 0); 
    }
  }

  private checkGoogleMapsLoaded(): void {
    this.isGoogleMapsLoaded = typeof google !== 'undefined' && google.maps && google.maps.places;
    if (!this.isGoogleMapsLoaded) {
      console.error('Google Maps Places API not loaded. Ensure the script tag includes libraries=places.');
    }
  }
  
  onEnableTargetChange(enabled: boolean): void {
    this.enableTargetChange.emit(enabled);
    if (enabled && this.isGoogleMapsLoaded) {
      setTimeout(() => this.initAutocomplete(), 0);
    }
    this.emitSettings();
  }

  private initAutocomplete(): void {
    if (!this.locationInput || !this.locationInput.nativeElement || !this.isGoogleMapsLoaded) return;
    
    if (this.autocomplete) {
      google.maps.event.clearInstanceListeners(this.locationInput.nativeElement);
    }

    const options = {
        types: ['geocode', 'establishment'], 
        fields: ['address_components', 'geometry', 'name', 'place_id', 'formatted_address', 'types']
    };

    try {
        this.autocomplete = new google.maps.places.Autocomplete(
            this.locationInput.nativeElement, 
            options
        );

        this.autocomplete.addListener('place_changed', () => {
            const place = this.autocomplete.getPlace();
            this.lastSelectedPlace = place;
            
            if (place.geometry && place.place_id) {
                this.addLocationTarget(place);
            } else {
                console.warn('Selected place has no geometry or place_id');
            }
        });

    } catch (error) {
        console.error('Error initializing Autocomplete:', error);
    }
  }
  
  private addLocationTarget(place: any): void {
    if (!place.geometry || !place.place_id) {
      return;
    }

    const name = place.formatted_address || place.name;
    const locationType = this.getPlaceType(place);

    const area: TargetingArea = {
      id: this.generateId(),
      name: name,
      type: locationType,
      place_id: place.place_id,
      address_components: place.address_components,
      coordinates: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      },
      precision: this.currentPrecision
    };

    this.addLocation.emit(area);
    this.locationInputControl.setValue('');
    this.lastSelectedPlace = null;
  }
  
  private getPlaceType(place: any): TargetingArea['type'] {
    if (!place.types) return 'place';
    
    if (place.types.includes('country')) {
        return 'country';
    }
    if (place.types.includes('locality') || place.types.includes('administrative_area_level_1') || place.types.includes('administrative_area_level_2')) {
        return 'city';
    }
    if (place.types.includes('route') || place.types.includes('street_address')) {
        return 'place';
    }
    return 'place';
  }

  onManualEntry(event?: any): void {
    if (event) {
      event.preventDefault();
    }

    const value = this.locationInputControl.value?.trim();
    if (!value) return;

    if (this.lastSelectedPlace && this.lastSelectedPlace.geometry) {
      this.addLocationTarget(this.lastSelectedPlace);
      return;
    }

    const area: TargetingArea = {
      id: this.generateId(),
      name: value,
      type: 'place', 
      place_id: `manual_${this.generateId()}`,
      coordinates: { lat: 0, lng: 0 }, 
      precision: this.currentPrecision
    };
    
    this.addLocation.emit(area);
    this.locationInputControl.setValue(''); 
    this.lastSelectedPlace = null;
  }

  onPrecisionChange(precision: 'high' | 'medium' | 'low'): void {
    this.currentPrecision = precision;
    this.emitSettings();
  }

  clearAllAreas(): void {
    this.removeLocation.emit('all'); 
  }
  
  getAreaDisplayName(area: TargetingArea): string {
    const precisionText = {
        high: ' (H)', medium: ' (M)', low: ' (L)'
    }[area.precision];
    return `${area.name} [${area.type.toUpperCase()}]${precisionText}`;
  }

  getAreaIcon(area: TargetingArea): string {
    switch (area.type) {
      case 'place': return 'place';
      case 'city': return 'location_city';
      case 'country': return 'public';
      default: return 'location_on';
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  private emitSettings(): void {
    const settings: TargetingSettings = {
      enabled: this.enableTarget,
      areas: [...this.targetLocations],
      precision: this.currentPrecision
    };
    this.targetingSettingsChange.emit(settings);
  }
}