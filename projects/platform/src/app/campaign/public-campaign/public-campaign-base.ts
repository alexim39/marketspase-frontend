import { Directive, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '@shared/services/api';

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
  private sessionId = Math.random().toString(36).slice(2, 10);
  private landingStart = Date.now();

  constructor() {
    this.upi.set(this.route.snapshot.paramMap.get('upi') || '');
    this.loadCampaign();
  }

  private trackEvent(event: string, extra: any = {}): void {
    this.apiService.post('api/v1/campaign/landing/event', {
      upi: this.upi(), event, sessionId: this.sessionId,
      phone: this.phone().trim() || undefined,
      ...extra,
    }).subscribe({ error: () => {} }); // fire-and-forget
  }

  protected loadCampaign(): void {
    this.trackEvent('landing_view');
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
    this.trackEvent('continue_click', { durationMs: Date.now() - this.landingStart });
    if (this.goal() === 'leads') { this.step.set('choice'); return; }
    this.trackEvent('proceed_click');
    this.redirectToDestination();
  }

  redirectToDestination(): void {
    const isDuplicate = this.leadDuplicate();
    const url = isDuplicate
      ? this.campaign()?.destinationUrl || `${this.apiService.getBaseUrl()}`
      : `${this.apiService.getBaseUrl()}/api/v1/campaign/track/${this.upi()}?go=1`;
    window.location.href = url;
  }

  /** For leads campaigns: skip the billable click, go straight to marketer destination */
  skipToDestination(): void {
    const dest = this.campaign()?.destinationUrl;
    if (dest && /^https?:\/\//i.test(dest)) {
      window.location.href = dest;
    } else {
      window.location.href = this.apiService.getBaseUrl();
    }
  }

  selectContactMe(): void {
    this.trackEvent('contact_me_select');
    this.step.set('form');
    this.trackEvent('form_view');
  }

  submitLead(): void {
    const p = this.phone().trim();
    this.formError.set('');
    if (!p) { this.formError.set('Please enter your phone number.'); return; }
    if (!/^[+]?[0-9]{10,15}$/.test(p.replace(/\s/g, ''))) { this.formError.set('Please enter a valid phone number.'); return; }
    this.trackEvent('form_submit');
    this.submitting.set(true);
    this.apiService.post<any>(`api/v1/campaign/lead/${this.upi()}`, { phone: p, email: this.email().trim() || undefined }).subscribe({
      next: (r) => {
        this.trackEvent('lead_success', { leadId: r.data?.leadId });
        if (r.duplicate) { this.leadDuplicate.set(true); }
        this.step.set('success'); this.submitting.set(false);
      },
      error: (e) => {
        this.trackEvent('lead_failure', { error: e.error?.message || 'unknown' });
        this.formError.set(e.error?.message || 'Error. Please try again.'); this.submitting.set(false);
      }
    });
  }
}
