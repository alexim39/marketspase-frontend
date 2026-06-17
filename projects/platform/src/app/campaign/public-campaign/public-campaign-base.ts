import { Directive, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '@shared/services';

@Directive()
export class PublicCampaignBase {
  protected route = inject(ActivatedRoute);
  protected apiService = inject(ApiService);

  readonly upi = signal('');
  readonly loading = signal(true);
  readonly error = signal('');
  readonly suspended = signal(false);
  readonly campaign = signal<any>(null);
  readonly goal = computed(() => this.campaign()?.promotionGoal || 'awareness');
  readonly step = signal<'landing' | 'choice' | 'form' | 'success'>('landing');
  readonly phone = signal('');
  readonly email = signal('');
  readonly formError = signal('');
  readonly submitting = signal(false);
  readonly leadDuplicate = signal(false);

  constructor() {
    this.upi.set(this.route.snapshot.paramMap.get('upi') || '');
    this.loadCampaign();
  }

  protected loadCampaign(): void {
    this.apiService.get<any>(`api/v1/campaign/preview/${this.upi()}`).subscribe({
      next: (r) => {
        if (r.suspended) { this.suspended.set(true); }
        else if (!r.success) { this.error.set('This link may be invalid or expired.'); }
        else { this.campaign.set(r.data); }
        this.loading.set(false);
      },
      error: () => { this.error.set('Unable to load this link right now. Please try again in a moment.'); this.loading.set(false); }
    });
  }

  handleContinue(): void {
    if (this.goal() === 'leads') { this.step.set('choice'); return; }
    this.redirectToDestination();
  }

  redirectToDestination(): void {
    const isDuplicate = this.leadDuplicate();
    const url = isDuplicate
      ? this.campaign()?.destinationUrl || `${this.apiService.getBaseUrl()}`
      : `${this.apiService.getBaseUrl()}/api/v1/campaign/track/${this.upi()}?go=1`;
    window.location.href = url;
  }

  submitLead(): void {
    const p = this.phone().trim();
    this.formError.set('');
    if (!p) { this.formError.set('Please enter your phone number.'); return; }
    if (!/^[+]?[0-9]{10,15}$/.test(p.replace(/\s/g, ''))) { this.formError.set('Please enter a valid phone number.'); return; }
    this.submitting.set(true);
    this.apiService.post<any>(`api/v1/campaign/lead/${this.upi()}`, { phone: p, email: this.email().trim() || undefined }).subscribe({
      next: (r) => {
        if (r.duplicate) { this.leadDuplicate.set(true); }
        this.step.set('success'); this.submitting.set(false);
      },
      error: (e) => { this.formError.set(e.error?.message || 'Error. Please try again.'); this.submitting.set(false); }
    });
  }
}
