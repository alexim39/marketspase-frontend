// learning-section.component.ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface LearningCourse {
  id: string;
  title: string;
  description: string;
  image: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  lessons: number;
  progress: number;
  category?: string;
  instructor?: string;
  rating?: number;
  enrolled?: number;
}

@Component({
  selector: 'learning-section',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  templateUrl: './learning-section.component.html',
  styleUrls: ['./learning-section.component.scss']
})
export class LearningSectionComponent {
  courses = input<LearningCourse[]>([]);
  savedCourses = input<Set<string>>(new Set());

  viewAll = output<void>();
  continueCourse = output<string>();
  saveCourse = output<string>();

  totalCourses = () => {
    return this.courses().length;
  }

  enrolledCount = () => {
    return this.courses().filter(c => c.progress > 0).length;
  }

  completedCount = () => {
    return this.courses().filter(c => c.progress === 100).length;
  }

  totalProgress = () => {
    const courses = this.courses();
    if (courses.length === 0) return 0;
    
    const total = courses.reduce((sum, c) => sum + c.progress, 0);
    return Math.round(total / courses.length);
  }

  isSaved(courseId: string): boolean {
    return this.savedCourses().has(courseId);
  }
}