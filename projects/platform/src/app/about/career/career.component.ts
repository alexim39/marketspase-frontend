// careers.component.ts
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

interface JobPosition {
  id: string;
  title: string;
  department: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  location: string;
  remote: boolean;
  experience: string;
  salary?: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  posted: string;
  applications: number;
  featured?: boolean;
  urgent?: boolean;
}

interface Department {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  openPositions: number;
}

interface Benefit {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

interface TeamCulture {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './career.component.html',
  styleUrls: ['./career.component.scss'],
})
export class CareersComponent {
  activeDepartment = signal<string>('all');

  benefits = signal<Benefit[]>([
    {
      icon: 'trending_up',
      title: 'Impactful Work',
      description: 'Build products that directly impact thousands of businesses and creators across Africa.',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: 'school',
      title: 'Continuous Learning',
      description: 'Access to courses, conferences, and mentorship programs to accelerate your growth.',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      icon: 'diversity',
      title: 'Great Team Culture',
      description: 'Collaborate with talented, passionate people in a supportive and inclusive environment.',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      icon: 'payments',
      title: 'Competitive Compensation',
      description: 'Attractive salary, equity options, and comprehensive benefits package.',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      icon: 'work_life',
      title: 'Work-Life Balance',
      description: 'Flexible working hours and remote work options to fit your lifestyle.',
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
    },
    {
      icon: 'health',
      title: 'Health & Wellness',
      description: 'Comprehensive health insurance, wellness programs, and mental health support.',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    }
  ]);

  teamCulture = signal<TeamCulture[]>([
    {
      icon: 'group',
      title: 'Collaborative Spirit',
      description: 'We believe in the power of teamwork and open communication across all levels.'
    },
    {
      icon: 'innovation',
      title: 'Innovation First',
      description: 'We encourage experimentation and reward creative problem-solving.'
    },
    {
      icon: 'diversity',
      title: 'Diversity & Inclusion',
      description: 'We celebrate different perspectives and build products for everyone.'
    },
    {
      icon: 'growth',
      title: 'Growth Mindset',
      description: 'We invest in our team\'s development and celebrate continuous learning.'
    }
  ]);

  departments = signal<Department[]>([
    {
      id: 'engineering',
      name: 'Engineering',
      description: 'Build and scale our technology platform',
      icon: 'code',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      openPositions: 6
    },
    {
      id: 'product',
      name: 'Product',
      description: 'Shape the future of our products',
      icon: 'dashboard',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      openPositions: 3
    },
    {
      id: 'marketing',
      name: 'Marketing',
      description: 'Grow our brand and user base',
      icon: 'campaign',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      openPositions: 2
    },
    {
      id: 'sales',
      name: 'Sales',
      description: 'Drive business growth and partnerships',
      icon: 'trending_up',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      openPositions: 2
    },
    {
      id: 'customer-success',
      name: 'Customer Success',
      description: 'Support and empower our users',
      icon: 'support_agent',
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      openPositions: 2
    }
  ]);

  jobPositions = signal<JobPosition[]>([
    {
      id: 'senior-frontend',
      title: 'Senior Frontend Developer',
      department: 'engineering',
      type: 'full-time',
      location: 'Lagos, Nigeria',
      remote: true,
      experience: '5+ years',
      salary: '₦400,000 - ₦600,000/month',
      description: 'Lead the development of our user-facing applications using Angular and modern web technologies.',
      responsibilities: [
        'Architect and build scalable frontend applications',
        'Mentor junior developers and conduct code reviews',
        'Collaborate with product designers and backend engineers',
        'Optimize application performance and user experience'
      ],
      requirements: [
        '5+ years experience with Angular/React/Vue',
        'Strong TypeScript and JavaScript skills',
        'Experience with state management solutions',
        'Knowledge of web performance optimization',
        'Experience with testing frameworks'
      ],
      benefits: [
        'Remote work flexibility',
        'Health insurance',
        'Professional development budget',
        'Equity options'
      ],
      posted: '2 days ago',
      applications: 24,
      featured: true
    },
    {
      id: 'product-manager',
      title: 'Product Manager',
      department: 'product',
      type: 'full-time',
      location: 'Remote',
      remote: true,
      experience: '3+ years',
      salary: '₦350,000 - ₦500,000/month',
      description: 'Drive product strategy and execution for our core platform features.',
      responsibilities: [
        'Define product roadmap and strategy',
        'Collaborate with engineering and design teams',
        'Conduct user research and gather insights',
        'Prioritize features and manage product backlog'
      ],
      requirements: [
        '3+ years product management experience',
        'Experience with agile development',
        'Strong analytical and problem-solving skills',
        'Excellent communication skills',
        'Technical background preferred'
      ],
      benefits: [
        'Fully remote position',
        'Flexible working hours',
        'Learning and development budget',
        'Quarterly team retreats'
      ],
      posted: '1 week ago',
      applications: 18
    },
    {
      id: 'devops-engineer',
      title: 'DevOps Engineer',
      department: 'engineering',
      type: 'full-time',
      location: 'Lagos, Nigeria',
      remote: true,
      experience: '4+ years',
      salary: '₦450,000 - ₦650,000/month',
      description: 'Build and maintain our cloud infrastructure and deployment pipelines.',
      responsibilities: [
        'Manage AWS cloud infrastructure',
        'Implement CI/CD pipelines',
        'Ensure system reliability and performance',
        'Automate deployment and monitoring processes'
      ],
      requirements: [
        '4+ years DevOps experience',
        'Strong AWS knowledge',
        'Experience with Docker and Kubernetes',
        'Infrastructure as Code (Terraform)',
        'Monitoring and logging tools experience'
      ],
      benefits: [
        'Remote work options',
        'Competitive salary',
        'Health and wellness benefits',
        'Conference attendance budget'
      ],
      posted: '3 days ago',
      applications: 15,
      urgent: true
    },
    {
      id: 'growth-marketer',
      title: 'Growth Marketing Manager',
      department: 'marketing',
      type: 'full-time',
      location: 'Remote',
      remote: true,
      experience: '3+ years',
      salary: '₦300,000 - ₦450,000/month',
      description: 'Develop and execute growth strategies to acquire and retain users.',
      responsibilities: [
        'Develop and implement growth strategies',
        'Manage digital marketing campaigns',
        'Analyze performance metrics and optimize ROI',
        'Collaborate with product and sales teams'
      ],
      requirements: [
        '3+ years growth marketing experience',
        'Digital marketing expertise',
        'Data analysis skills',
        'Experience with marketing automation',
        'Creative problem-solving ability'
      ],
      benefits: [
        'Performance bonuses',
        'Remote work flexibility',
        'Marketing budget ownership',
        'Career growth opportunities'
      ],
      posted: '5 days ago',
      applications: 22
    }
  ]);

  filteredPositions = signal<JobPosition[]>([]);

  constructor() {
    this.updateFilteredPositions();
  }

  setActiveDepartment(department: string): void {
    this.activeDepartment.set(department);
    this.updateFilteredPositions();
  }

  private updateFilteredPositions(): void {
    if (this.activeDepartment() === 'all') {
      this.filteredPositions.set(this.jobPositions());
    } else {
      const filtered = this.jobPositions().filter(position => position.department === this.activeDepartment());
      this.filteredPositions.set(filtered);
    }
  }

  getPositionTypeLabel(type: string): string {
    switch (type) {
      case 'full-time': return 'Full Time';
      case 'part-time': return 'Part Time';
      case 'contract': return 'Contract';
      case 'internship': return 'Internship';
      default: return type;
    }
  }

  applyForPosition(position: JobPosition): void {
    // Implement application logic
    console.log('Applying for position:', position.title);
    // this.router.navigate(['/careers/apply', position.id]);
  }

  scrollToPositions(): void {
    const element = document.querySelector('.positions-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  openTalentNetwork(): void {
    // Open talent network form or page
    console.log('Opening talent network');
  }
}