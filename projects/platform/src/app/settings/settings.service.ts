import { Injectable } from '@angular/core';
import { ApiService } from '@shared/services';

  
export interface ProfessionalInfoInterface {
  id: string;
  jobTitle: string;
  educationBackground: string;
  hobby: string;
  skill: string;
}

@Injectable()
export class SettingsService {
  constructor(private apiService: ApiService) {}



   
}