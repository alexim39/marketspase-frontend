import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../common/services/api.service';
import { FormGroup } from '@angular/forms';
import { UserInterface } from '../common/services/user.service';

  
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