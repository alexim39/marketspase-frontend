import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FooterComponent } from '../../core/footer/footer.component';
import { HeaderComponent } from '../../core/header/header.component';
import { Benefit, CareersComponent, JobPosition, TeamCulture } from '../career.component';

type CareersSheet = 'job' | 'benefit' | 'culture' | 'process' | null;

interface HiringStep {
  number: string;
  title: string;
  text: string;
  duration: string;
  icon: string;
}

interface CareerTestimonial {
  name: string;
  role: string;
  tenure: string;
  quote: string;
  metric: string;
}

@Component({
  selector: 'app-careers-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, HeaderComponent, FooterComponent],
  templateUrl: './careers-mobile.component.html',
  styleUrls: ['./careers-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareersMobileComponent extends CareersComponent {
  protected readonly activeSheet = signal<CareersSheet>(null);
  protected readonly selectedJob = signal<JobPosition | null>(null);
  protected readonly selectedBenefit = signal<Benefit | null>(null);
  protected readonly selectedCulture = signal<TeamCulture | null>(null);
  protected readonly selectedStep = signal<HiringStep | null>(null);

  protected readonly heroStats = computed(() => [
    { icon: 'work', value: `${this.jobPositions().length}+`, label: 'Open roles' },
    { icon: 'groups', value: '25+', label: 'Team members' },
    { icon: 'public', value: '3+', label: 'Countries' },
    { icon: 'rocket_launch', value: 'NGN 100M+', label: 'Raised' },
  ]);

  protected readonly currentDepartment = computed(() => {
    if (this.activeDepartment() === 'all') {
      return {
        name: 'All teams',
        description: 'Browse every open role across product, engineering, marketing, sales, and customer success.',
      };
    }

    const department = this.departments().find(item => item.id === this.activeDepartment());
    return department ?? {
      name: 'Selected team',
      description: 'Open roles for the selected department.',
    };
  });

  protected readonly hiringSteps: HiringStep[] = [
    {
      number: '01',
      title: 'Application review',
      text: 'We review your experience, portfolio, and how your work connects with MarketSpase users.',
      duration: '1-2 days',
      icon: 'fact_check',
    },
    {
      number: '02',
      title: 'Screening call',
      text: 'A short conversation about the role, your goals, and the way the team works.',
      duration: '30 mins',
      icon: 'phone_in_talk',
    },
    {
      number: '03',
      title: 'Practical task',
      text: 'A realistic exercise that lets you show judgment without unnecessary pressure.',
      duration: '2-3 days',
      icon: 'assignment',
    },
    {
      number: '04',
      title: 'Team interviews',
      text: 'Meet teammates, discuss decisions, and check how we collaborate.',
      duration: '1-2 hours',
      icon: 'forum',
    },
    {
      number: '05',
      title: 'Offer and onboarding',
      text: 'We align on compensation, start date, tools, and your first 30 days.',
      duration: '1 week',
      icon: 'verified',
    },
  ];

  protected readonly testimonials: CareerTestimonial[] = [
    {
      name: 'Alex Imenwo',
      role: 'Team Lead, Engineering',
      tenure: '2 years',
      quote: 'MarketSpase has given me the opportunity to work on challenging problems while growing as a leader.',
      metric: 'Growth into leadership',
    },
    {
      name: 'Jude Anyanwu',
      role: 'Operations Manager',
      tenure: '1.5 years',
      quote: 'The collaborative culture here is incredible. Everyone is passionate about helping users succeed.',
      metric: 'Operational impact',
    },
    {
      name: 'Andrew Anih',
      role: 'Software Quality Assurance',
      tenure: '8 months',
      quote: 'The learning opportunities and mentorship have accelerated my career in ways I never expected.',
      metric: 'Fast learning path',
    },
  ];

  protected openJob(position: JobPosition): void {
    this.selectedJob.set(position);
    this.activeSheet.set('job');
  }

  protected openBenefit(benefit: Benefit): void {
    this.selectedBenefit.set(benefit);
    this.activeSheet.set('benefit');
  }

  protected openCulture(point: TeamCulture): void {
    this.selectedCulture.set(point);
    this.activeSheet.set('culture');
  }

  protected openProcess(step: HiringStep): void {
    this.selectedStep.set(step);
    this.activeSheet.set('process');
  }

  protected closeSheet(): void {
    this.activeSheet.set(null);
    this.selectedJob.set(null);
    this.selectedBenefit.set(null);
    this.selectedCulture.set(null);
    this.selectedStep.set(null);
  }

  protected formatApplications(position: JobPosition): string {
    return typeof position.applications === 'number'
      ? `${position.applications} applicants`
      : position.applications;
  }

  protected formatLocation(position: JobPosition): string {
    return `${position.location}${position.remote ? ' · Remote' : ''}`;
  }

  protected tone(index: number): string {
    return ['tone-blue', 'tone-green', 'tone-purple', 'tone-orange'][index % 4];
  }
}
