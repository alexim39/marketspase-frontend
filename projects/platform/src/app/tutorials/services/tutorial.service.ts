// services/tutorial.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../../../shared-services/src/public-api';

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  videoUrl: string;
  videoType: 'youtube' | 'vimeo' | 'local';
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  views: number;
  isNew?: boolean;
  isPopular?: boolean;
}

export interface Section {
  title: string;
  description: string;
  icon: string;
  videos: VideoItem[];
}

@Injectable()
export class TutorialService {
  private readonly apiService: ApiService = inject(ApiService);
  private apiUrl = 'tutorials';

  getTutorials(role?: string): Observable<Section[]> {
    let params: any = {};
    if (role && role !== 'admin') {
      params.role = role;
    }

    return this.apiService.get<{ success: boolean; data: Section[] }>(
      `${this.apiUrl}/list`,
      params
    ).pipe(
      map(response => response.data)
    );
  }
}