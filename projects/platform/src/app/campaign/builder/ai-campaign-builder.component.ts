import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '@shared/services/api';
import { UserService } from '../../common/services/user.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-ai-campaign-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './ai-campaign-builder.component.html',
  styleUrls: ['./ai-campaign-builder.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(12px)' }), animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))]),
    ]),
  ],
})
export class AiCampaignBuilderComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private userService = inject(UserService);

  readonly walletBalance = computed(() => this.userService.user()?.wallets?.marketer?.balance ?? 0);

  description = '';
  goal = signal<'sales' | 'leads' | 'awareness'>('sales');
  budgetTier = signal<'low' | 'medium' | 'high'>('medium');
  loading = signal(false);
  uploading = signal(false);
  uploadProgress = signal(0);
  error = signal('');
  selectedFile = signal<File | null>(null);
  previewUrl = signal('');
  isDragOver = signal(false);

  readonly goals = [
    { id: 'sales', icon: 'shopping_cart', label: 'Get more sales', desc: 'Drive purchases and orders' },
    { id: 'leads', icon: 'contact_mail', label: 'Collect leads', desc: 'Gather customer contacts' },
    { id: 'awareness', icon: 'visibility', label: 'Build awareness', desc: 'Get your brand seen' },
  ] as const;

  readonly budgetTiers = [
    { id: 'low', label: 'Low', range: '₦1K - ₦5K', value: 30 },
    { id: 'medium', label: 'Medium', range: '₦5K - ₦20K', value: 50 },
    { id: 'high', label: 'High', range: '₦20K+', value: 70 },
  ] as const;

  get budgetSliderValue(): number {
    return this.budgetTiers.find(t => t.id === this.budgetTier())?.value || 50;
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.processFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    this.processFile(file);
  }

  private processFile(file: File | null | undefined): void {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { this.error.set('File must be under 50MB'); return; }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowed.includes(file.type)) { this.error.set('JPEG, PNG, WebP, GIF, MP4, WebM, or MOV files only'); return; }
    this.selectedFile.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
    this.error.set('');
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.previewUrl.set('');
  }

  onSliderChange(value: number): void {
    if (value <= 33) this.budgetTier.set('low');
    else if (value <= 66) this.budgetTier.set('medium');
    else this.budgetTier.set('high');
  }

  async generate(): Promise<void> {
    if (!this.description.trim()) { this.error.set('Tell us what you are promoting'); return; }
    this.loading.set(true);
    this.error.set('');

    try {
      // Step 1: AI suggestions
      const resp = await this.api.post<any>('api/v1/campaign/suggest', {
        description: this.description.trim(),
        goal: this.goal(),
        budgetTier: this.budgetTier(),
      }, undefined, true).toPromise();
      if (!resp?.success) throw new Error(resp?.message || 'Generation failed');

      const data = resp.data;
      let mediaUrl = '';
      let mediaType = 'image';
      let mediaPublicId = '';

      // Step 2: Upload media if selected
      if (this.selectedFile()) {
        this.uploading.set(true);
        try {
          const form = new FormData();
          form.append('media', this.selectedFile()!, this.selectedFile()!.name);
          const uploadResp = await this.api.post<any>('api/v1/campaign/media/upload', form, undefined, true).toPromise();
          if (uploadResp?.success && uploadResp.data) {
            mediaUrl = uploadResp.data.mediaUrl || uploadResp.data.url || '';
            mediaType = uploadResp.data.mediaType || 'image';
            mediaPublicId = uploadResp.data.mediaPublicId || '';
          }
        } catch (e) {
          this.snack.open('Media upload failed. You can add it on the next step.', 'OK', { duration: 4000 });
        }
        this.uploading.set(false);
      }

      // Navigate with everything
      this.router.navigate(['/dashboard/campaigns/create'], {
        state: {
          aiGenerated: {
            title: data.title,
            caption: data.caption,
            category: data.category,
            budget: data.suggestedBudget,
            ageTarget: data.ageTarget,
            campaignGoal: data.campaignGoal,
            payoutModel: data.payoutModel,
            link: data.link || '',
            mediaUrl,
            mediaType,
            mediaPublicId,
          },
        },
      });
    } catch (e: any) {
      this.error.set(e?.message || 'Something went wrong. Try again or use manual setup.');
    } finally {
      this.loading.set(false);
    }
  }

  skipToManual(): void {
    this.router.navigate(['/dashboard/campaigns/create']);
  }
}
