import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BasicInfoFormComponent } from '../components/basic-info-form/basic-info-form.component';
import { BudgetSettingsComponent } from '../components/budget-settings/budget-settings.component';
import { RequirementsFormComponent } from '../components/requirements-form/requirements-form.component';
import { ScheduleFormComponent } from '../components/schedule-form/schedule-form.component';
import { CampaignEditComponent } from '../campaign-edit.component';
import { CampaignEditService } from '../campaign-edit.service';

type CampaignEditSectionId = 'basic' | 'budget' | 'schedule' | 'requirements' | 'targeting';

interface CampaignEditSection {
  id: CampaignEditSectionId;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-campaign-edit-mobile',
  standalone: true,
  providers: [CampaignEditService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    BasicInfoFormComponent,
    BudgetSettingsComponent,
    ScheduleFormComponent,
    RequirementsFormComponent,
  ],
  templateUrl: './campaign-edit-mobile.component.html',
  styleUrls: ['./campaign-edit-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignEditMobileComponent extends CampaignEditComponent {
  private readonly mobileRouter = inject(Router);

  protected readonly sections: CampaignEditSection[] = [
    {
      id: 'basic',
      label: 'Basics',
      description: 'Campaign title, caption, category, and landing link.',
      icon: 'edit_note',
    },
    {
      id: 'budget',
      label: 'Budget',
      description: 'Promoter payout and PPC spend settings.',
      icon: 'payments',
    },
    {
      id: 'schedule',
      label: 'Schedule',
      description: 'Start date, end date, and campaign availability.',
      icon: 'event_available',
    },
    {
      id: 'requirements',
      label: 'Rules',
      description: 'Promoter requirements, rating, and priority.',
      icon: 'verified_user',
    },
    {
      id: 'targeting',
      label: 'Targeting',
      description: 'Open geographic targeting in the dedicated workspace.',
      icon: 'travel_explore',
    },
  ];

  protected readonly activeSection = signal<CampaignEditSectionId>('basic');
  protected readonly discardPromptOpen = signal(false);
  protected readonly targetingPromptOpen = signal(false);

  protected readonly activeSectionMeta = computed(() => (
    this.sections.find(section => section.id === this.activeSection()) || this.sections[0]
  ));

  protected readonly activeSectionIndex = computed(() => (
    this.sections.findIndex(section => section.id === this.activeSection())
  ));

  protected readonly isLastSection = computed(() => (
    this.activeSectionIndex() === this.sections.length - 1
  ));

  protected readonly formTitle = computed(() => {
    const formTitle = this.campaignForm?.get('title')?.value;
    return formTitle || this.campaign()?.title || 'Campaign edit';
  });

  protected readonly campaignStatus = computed(() => this.campaign()?.status || 'draft');

  protected readonly campaignTiming = computed(() => {
    const startDate = this.campaignForm?.get('startDate')?.value;
    const endDate = this.campaignForm?.get('endDate')?.value;

    if (!startDate) {
      return 'Schedule not set';
    }

    if (!endDate) {
      return 'No end date';
    }

    return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
  });

  protected readonly saveLabel = computed(() => this.isSaving() ? 'Saving...' : 'Save changes');

  protected selectSection(sectionId: CampaignEditSectionId): void {
    this.activeSection.set(sectionId);
  }

  protected goToPreviousSection(): void {
    const previousIndex = Math.max(this.activeSectionIndex() - 1, 0);
    this.activeSection.set(this.sections[previousIndex].id);
  }

  protected handlePrimaryAction(): void {
    if (this.isLastSection()) {
      this.saveCampaign();
      return;
    }

    const nextIndex = Math.min(this.activeSectionIndex() + 1, this.sections.length - 1);
    this.activeSection.set(this.sections[nextIndex].id);
  }

  protected sectionHasInvalidControls(sectionId: CampaignEditSectionId): boolean {
    if (!this.campaignForm || sectionId === 'targeting') {
      return false;
    }

    return this.sectionControls[sectionId].some(controlName => {
      const control = this.campaignForm.get(controlName);
      return !!control && control.invalid && (control.touched || this.campaignForm.dirty);
    });
  }

  protected openTargetingWorkspace(): void {
    if (this.campaignForm?.dirty) {
      this.targetingPromptOpen.set(true);
      return;
    }

    this.navigateToCampaignTargeting();
  }

  override cancelEdit(): void {
    if (this.campaignForm?.dirty) {
      this.discardPromptOpen.set(true);
      return;
    }

    this.navigateToCampaignDetails();
  }

  override goBack(): void {
    this.cancelEdit();
  }

  protected closePrompts(): void {
    this.discardPromptOpen.set(false);
    this.targetingPromptOpen.set(false);
  }

  protected discardAndLeave(): void {
    this.closePrompts();
    this.navigateToCampaignDetails();
  }

  protected discardAndOpenTargeting(): void {
    this.closePrompts();
    this.navigateToCampaignTargeting();
  }

  private readonly sectionControls: Record<Exclude<CampaignEditSectionId, 'targeting'>, string[]> = {
    basic: ['title', 'caption', 'category', 'link', 'campaignType'],
    budget: [],
    schedule: ['startDate', 'endDate', 'hasEndDate'],
    requirements: ['requirements', 'minRating', 'priority'],
  };

  private navigateToCampaignDetails(): void {
    this.mobileRouter.navigate(['/dashboard/campaigns', this.campaign()?._id]);
  }

  private navigateToCampaignTargeting(): void {
    this.mobileRouter.navigate(['/dashboard/campaigns', this.campaign()?._id, 'targeting']);
  }

  private formatDate(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Schedule not set';
    }

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
