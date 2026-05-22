import {
  Component,
  DestroyRef,
  ElementRef,
  Signal,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DeviceService, PromotionInterface, UserInterface } from '@shared/services';
import { PromoterService } from '../../promoter.service';
import { UserService } from '../../../common/services/user.service';
import { ShareService } from '../../../store/services/share.service';

import {
  AD_INDUSTRIES,
  AD_LAYOUTS,
  AD_PLATFORMS,
  getIndustryById,
  getLayoutById,
  getPlatformById,
} from './ad-template-catalog';
import {
  canvasToJpegBlob,
  pickBestRecorderMimeType,
  recordCanvasVideo,
  renderAdFrame,
} from './ad-template-renderer';
import { AdBuildPromotionRef, AdBuildConfig, AdMediaSource } from './ad-template-builder.models';

type LinkMode = 'select' | 'paste';

@Component({
  selector: 'app-ad-template-builder',
  standalone: true,
  providers: [ShareService],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatChipsModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './ad-template-builder.component.html',
  styleUrls: ['./ad-template-builder.component.scss'],
})
export class AdTemplateBuilderComponent {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly promoterService = inject(PromoterService);
  private readonly shareService = inject(ShareService);
  private readonly userService = inject(UserService);
  private readonly deviceService = inject(DeviceService);

  readonly user: Signal<UserInterface | null> = this.userService.user;
  readonly deviceType = computed(() => this.deviceService.type());

  readonly platforms = AD_PLATFORMS;
  readonly layouts = AD_LAYOUTS;
  readonly industries = AD_INDUSTRIES;

  readonly isLoadingPromotions = signal(false);
  readonly promotions = signal<PromotionInterface[]>([]);
  readonly promotionsLoadError = signal<string | null>(null);

  readonly selectedPromotion = signal<PromotionInterface | null>(null);
  readonly promotionRef = computed<AdBuildPromotionRef | null>(() => {
    const promo = this.selectedPromotion();
    if (!promo) return null;

    return {
      id: promo._id,
      title: promo.campaign?.title || 'Promotion',
      upi: String(promo.upi || ''),
      promotionUrl: promo.promotionUrl || undefined,
      campaignMediaUrl: promo.campaign?.mediaType === 'video' ? (promo.campaign?.thumbnailUrl || '') : (promo.campaign?.mediaUrl || ''),
      campaignThumbnailUrl: promo.campaign?.thumbnailUrl || '',
    };
  });

  readonly apiBase = this.promoterService.api;

  readonly builderForm = this.fb.group({
    linkMode: ['select' as LinkMode, { validators: [Validators.required] }],
    promotionId: [''],
    customLink: [''],

    platformId: ['whatsapp', { validators: [Validators.required] }],
    layoutId: ['story_9_16', { validators: [Validators.required] }],
    industryId: ['general'],
    accentColor: [''],

    mediaSource: ['campaign' as AdMediaSource],
    headline: [''],
    caption: [''],
  });

  // Reactive-forms values are not Signals, so any signal-based computed needs a bridged snapshot.
  // This keeps template computeds (button disabled states, link preview) in sync with form edits.
  readonly formValue = signal(this.builderForm.getRawValue());

  private accentTouched = false;

  private normalizeExternalLink(value: string): string {
    const raw = String(value || '').trim();
    if (!raw) return '';

    if (/^https?:\/\//i.test(raw)) return raw;

    // Allow pasting "www.example.com/..." or "example.com/..." without scheme.
    if (/^www\./i.test(raw)) return `https://${raw}`;
    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(raw)) return `https://${raw}`;

    return raw;
  }

  private isValidExternalLink(value: string): boolean {
    const normalized = this.normalizeExternalLink(value);
    if (!normalized) return false;

    try {
      // eslint-disable-next-line no-new
      new URL(normalized);
      return true;
    } catch {
      return false;
    }
  }

  @ViewChild('previewCanvas', { static: true }) previewCanvas!: ElementRef<HTMLCanvasElement>;
  readonly previewError = signal<string | null>(null);
  readonly previewBusy = signal(false);

  private mediaElement: HTMLImageElement | null = null;
  readonly mediaLabel = signal<string>('Campaign media');
  readonly mediaUrl = signal<string | null>(null);

  readonly availableLayouts = computed(() => {
    const platform = getPlatformById(this.formValue().platformId);
    const allowed = new Set(platform?.layoutIds || []);
    return AD_LAYOUTS.filter((layout) => allowed.has(layout.id));
  });

  readonly selectedLayout = computed(() => getLayoutById(this.formValue().layoutId));
  readonly selectedPlatform = computed(() => getPlatformById(this.formValue().platformId));
  readonly selectedIndustry = computed(() => getIndustryById(this.formValue().industryId));

  readonly previewAspectRatio = computed(() => {
    const layout = this.selectedLayout();
    if (!layout) return '9 / 16';
    return `${layout.width} / ${layout.height}`;
  });

  readonly promotionLink = computed(() => {
    const mode = (this.formValue().linkMode as LinkMode) || 'select';
    if (mode === 'paste') {
      return this.normalizeExternalLink(String(this.formValue().customLink || ''));
    }

    const promo = this.selectedPromotion();
    if (!promo) return '';

    if (promo.promotionUrl) return promo.promotionUrl;
    // Normalize base url to avoid accidental double slashes in the generated share link.
    return `${this.apiBase.replace(/\/$/, '')}/api/v1/campaign/track/${promo.upi}`;
  });

  readonly captionWithLink = computed(() => {
    const caption = String(this.formValue().caption || '').trim();
    const link = this.promotionLink();
    if (!link) return caption;
    if (!caption) return link;
    return `${caption}\n\n${link}`;
  });

  readonly canContinueSelectPromotion = computed(() => {
    const mode = (this.formValue().linkMode as LinkMode) || 'select';
    if (mode === 'paste') {
      return this.isValidExternalLink(String(this.formValue().customLink || ''));
    }
    return Boolean(this.selectedPromotion()?._id);
  });

  readonly canContinueTemplate = computed(() => Boolean(this.selectedLayout() && this.selectedPlatform()));

  readonly canContinueCopy = computed(() => Boolean(this.captionWithLink().trim()));

  private loadedPromotionsForUserId: string | null = null;

  constructor() {
    // User is loaded asynchronously; make promotions loading resilient to "user is null during ctor".
    effect(() => {
      const userId = this.user()?._id || null;
      if (!userId) return;
      if (this.loadedPromotionsForUserId === userId) return;
      this.loadedPromotionsForUserId = userId;
      this.loadPromotions(userId);
    });

    // Keep signal snapshot in sync with reactive form changes.
    this.builderForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formValue.set(this.builderForm.getRawValue());
      });

    this.builderForm.controls.industryId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((industryId) => {
        if (this.accentTouched) return;
        const industry = getIndustryById(industryId);
        this.builderForm.controls.accentColor.setValue(industry?.accent || '#0f172a', { emitEvent: false });
        this.renderPreview();
      });

    this.builderForm.controls.accentColor.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.accentTouched = true;
      });

    this.builderForm.controls.platformId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((platformId) => {
        const platform = getPlatformById(platformId);
        const allowed = new Set(platform?.layoutIds || []);
        const currentLayout = this.builderForm.controls.layoutId.value;
        if (currentLayout && allowed.has(currentLayout as any)) return;
        const firstAllowed = platform?.layoutIds?.[0] || 'square_1_1';
        this.builderForm.controls.layoutId.setValue(firstAllowed as any);
      });

    this.builderForm.valueChanges
      .pipe(debounceTime(80), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.renderPreview());
  }

  loadPromotions(userId?: string | null): void {
    const resolvedUserId = userId || this.user()?._id || null;
    if (!resolvedUserId) return;

    // Builder should always show the freshest promotion list (avoid stale 5-min cache after promoter activity).
    this.promoterService.invalidateUserPromotionsCache(resolvedUserId);

    this.isLoadingPromotions.set(true);
    this.promotionsLoadError.set(null);

    this.promoterService
      .getUserPromotions(resolvedUserId, {
        status: 'accepted',
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          const rows = resp?.data || [];
          this.promotions.set(rows);
          this.isLoadingPromotions.set(false);
        },
        error: (err) => {
          console.error('Failed to load promotions for ad builder:', err);
          this.promotionsLoadError.set('Unable to load promotions right now.');
          this.isLoadingPromotions.set(false);
        },
      });
  }

  onPromotionSelected(promotionId: string): void {
    const promo = this.promotions().find((p) => p._id === promotionId) || null;
    this.selectedPromotion.set(promo);

    if (promo) {
      // Prefill headline/caption once (only if promoter has not started typing).
      const headline = String(this.builderForm.controls.headline.value || '').trim();
      const caption = String(this.builderForm.controls.caption.value || '').trim();
      if (!headline) this.builderForm.controls.headline.setValue(promo.campaign?.title || '');
      if (!caption) this.builderForm.controls.caption.setValue(promo.campaign?.caption || '');

      this.builderForm.controls.mediaSource.setValue('campaign');
      this.useCampaignMedia();
    }
  }

  onLinkModeChanged(mode: LinkMode): void {
    this.builderForm.controls.linkMode.setValue(mode);
    if (mode === 'paste') {
      this.selectedPromotion.set(null);
      this.builderForm.controls.promotionId.setValue('');
      this.mediaElement = null;
      this.mediaUrl.set(null);
      this.mediaLabel.set('No media');
      this.renderPreview();
    } else {
      this.builderForm.controls.customLink.setValue('');
    }
  }

  async useCampaignMedia(): Promise<void> {
    const ref = this.promotionRef();
    const url = ref?.campaignMediaUrl || ref?.campaignThumbnailUrl || '';
    if (!url) {
      this.mediaElement = null;
      this.mediaUrl.set(null);
      this.mediaLabel.set('No campaign media');
      this.renderPreview();
      return;
    }

    this.builderForm.controls.mediaSource.setValue('campaign', { emitEvent: false });
    await this.loadImageFromUrl(url, 'Campaign media');
  }

  async onMediaFilePicked(file: File | null): Promise<void> {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Please upload an image file for now.', 'OK', { duration: 3200 });
      return;
    }

    this.builderForm.controls.mediaSource.setValue('upload', { emitEvent: false });
    const objectUrl = URL.createObjectURL(file);
    await this.loadImageFromUrl(objectUrl, file.name, true);
  }

  private async loadImageFromUrl(url: string, label: string, alreadyObjectUrl = false): Promise<void> {
    this.previewBusy.set(true);
    this.previewError.set(null);

    try {
      const resolvedUrl = alreadyObjectUrl ? url : await this.fetchAsObjectUrl(url);
      const img = await this.loadImage(resolvedUrl);
      this.mediaElement = img;
      this.mediaUrl.set(resolvedUrl);
      this.mediaLabel.set(label);
      this.renderPreview();
    } catch (error: any) {
      console.error('Failed to load media:', error);
      this.mediaElement = null;
      this.mediaUrl.set(null);
      this.previewError.set('Unable to load media for preview.');
      this.renderPreview();
    } finally {
      this.previewBusy.set(false);
    }
  }

  private async fetchAsObjectUrl(url: string): Promise<string> {
    try {
      const resp = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (!resp.ok) return url;
      const blob = await resp.blob();
      return URL.createObjectURL(blob);
    } catch {
      return url;
    }
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image_load_failed'));
      img.src = url;
    });
  }

  private getRenderConfig(): AdBuildConfig {
    const industry = this.selectedIndustry();
    const accent = String(this.builderForm.controls.accentColor.value || '').trim() || industry?.accent || '#0f172a';

    return {
      platformId: (this.builderForm.controls.platformId.value as any) || 'generic',
      layoutId: (this.builderForm.controls.layoutId.value as any) || 'square_1_1',
      industryId: this.builderForm.controls.industryId.value || null,
      accentColor: accent,
      mediaSource: (this.builderForm.controls.mediaSource.value as AdMediaSource) || 'none',
      headline: String(this.builderForm.controls.headline.value || ''),
      caption: String(this.builderForm.controls.caption.value || ''),
      includeQr: false,
    };
  }

  renderPreview(): void {
    const layout = this.selectedLayout();
    const canvas = this.previewCanvas?.nativeElement;
    if (!canvas || !layout) return;

    const config = this.getRenderConfig();

    renderAdFrame({
      canvas,
      layout,
      promotion: this.promotionRef(),
      config,
      media: this.mediaElement,
      timeMs: 0,
    });
  }

  async exportJpeg(): Promise<void> {
    const layout = this.selectedLayout();
    const canvas = this.previewCanvas?.nativeElement;
    if (!canvas || !layout) return;

    this.previewBusy.set(true);
    this.previewError.set(null);

    try {
      this.renderPreview();
      const blob = await canvasToJpegBlob(canvas);
      this.downloadBlob(blob, this.buildFilename('jpg'));
      this.snackBar.open('Ad image exported.', 'OK', { duration: 2200 });
    } catch (error: any) {
      console.error('JPEG export failed:', error);
      this.previewError.set(error?.message || 'Failed to export image.');
      this.snackBar.open('Failed to export image.', 'OK', { duration: 3000 });
    } finally {
      this.previewBusy.set(false);
    }
  }

  async exportVideo(): Promise<void> {
    const layout = this.selectedLayout();
    const canvas = this.previewCanvas?.nativeElement;
    if (!canvas || !layout) return;

    this.previewBusy.set(true);
    this.previewError.set(null);

    const mimeType = pickBestRecorderMimeType();
    if (!mimeType) {
      this.previewBusy.set(false);
      this.snackBar.open('Video export is not supported on this browser.', 'OK', { duration: 3500 });
      return;
    }

    try {
      const config = this.getRenderConfig();
      const promotion = this.promotionRef();
      const media = this.mediaElement;

      const blob = await recordCanvasVideo({
        canvas,
        durationMs: 6500,
        fps: 30,
        mimeType,
        onFrame: (timeMs) => {
          renderAdFrame({
            canvas,
            layout,
            promotion,
            config,
            media,
            timeMs,
          });
        },
      });

      const ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
      this.downloadBlob(blob, this.buildFilename(ext));
      this.snackBar.open('Ad video exported.', 'OK', { duration: 2400 });
    } catch (error: any) {
      console.error('Video export failed:', error);
      this.previewError.set(error?.message || 'Failed to export video.');
      this.snackBar.open('Failed to export video.', 'OK', { duration: 3500 });
    } finally {
      this.previewBusy.set(false);
      this.renderPreview();
    }
  }

  async copyLink(): Promise<void> {
    const link = this.promotionLink();
    if (!link) return;
    await this.shareService.copyToClipboard(link);
  }

  async copyCaption(): Promise<void> {
    const caption = this.builderForm.controls.caption.value || '';
    await this.shareService.copyToClipboard(String(caption));
  }

  async copyCaptionWithLink(): Promise<void> {
    await this.shareService.copyToClipboard(this.captionWithLink());
  }

  private buildFilename(ext: string): string {
    const platform = this.selectedPlatform()?.id || 'ad';
    const layout = this.selectedLayout()?.id || 'layout';
    const stamp = new Date().toISOString().slice(0, 10);
    return `marketspase-${platform}-${layout}-${stamp}.${ext}`;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
