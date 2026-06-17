import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-public-campaign',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="landing-page">
      @if (loading()) {
        <div class="loading"><div class="spinner"></div><p>Loading...</p></div>
      } @else if (error()) {
        <div class="error"><h2>Oops!</h2><p>{{ error() }}</p></div>
      } @else if (suspended()) {
        <div class="error"><h2>Link Unavailable</h2><p>This promotion link has been paused or removed.</p></div>
      } @else if (campaign()) {
        <div class="header"><span class="brand">MarketSpase</span></div>
        <div class="container">
          <!-- Step 1: Landing -->
          @if (step() === 'landing') {
            <div class="card">
              @if (campaign()!.mediaUrl && campaign()!.mediaType !== 'video') {
                <img class="media" [src]="campaign()!.mediaUrl" [alt]="campaign()!.title">
              } @else if (campaign()!.mediaUrl && campaign()!.mediaType === 'video') {
                <video class="media" [src]="campaign()!.mediaUrl" controls preload="metadata" playsinline [poster]="campaign()!.thumbnailUrl"></video>
              } @else {
                <div class="media-placeholder">📣</div>
              }
              <div class="card-body">
                <div class="meta">
                  <span class="badge" [class.leads]="goal()==='leads'" [class.awareness]="goal()!=='leads'">{{ goal() === 'leads' ? 'Lead Campaign' : 'Awareness' }}</span>
                  @if (campaign()!.category) { <span class="cat">{{ campaign()!.category }}</span> }
                </div>
                <h1>{{ campaign()!.title }}</h1>
                @if (campaign()!.caption) { <p class="desc">{{ campaign()!.caption }}</p> }
                @if (campaign()!.promoterName) {
                  <div class="promoter"><div class="avatar">{{ (campaign()!.promoterName||'P').charAt(0) }}</div><span>Shared by {{ campaign()!.promoterName }}</span></div>
                }
              </div>
            </div>
            <button class="btn" (click)="handleContinue()">Continue →</button>
          }

          <!-- Step 2: Lead Choice -->
          @if (step() === 'choice') {
            <div class="card">
              <div class="card-body">
                <h1>Stay in the loop</h1>
                <p class="desc">Would you like the business owner to contact you with more information about this promotion?</p>
                <div class="choices">
                  <button class="btn success" (click)="step.set('form')">Yes, Contact Me</button>
                  <button class="btn secondary" (click)="redirectToDestination()">No Thanks, Continue</button>
                </div>
              </div>
            </div>
          }

          <!-- Step 3: Lead Form -->
          @if (step() === 'form') {
            <div class="card">
              <div class="card-body">
                <h1>Your Details</h1>
                <p class="desc">Enter your phone number and the business owner will reach out with details.</p>
                <div class="field"><label>Phone Number *</label><input class="input" type="tel" [(ngModel)]="phone" placeholder="e.g. +234 801 234 5678"></div>
                <div class="field"><label>Email (optional)</label><input class="input" type="email" [(ngModel)]="email" placeholder="you@example.com"></div>
                @if (formError()) { <p class="err">{{ formError() }}</p> }
                <p class="hint">By continuing, we might send you a quick message with details.</p>
                <button class="btn" (click)="submitLead()" [disabled]="submitting()">
                  @if (submitting()) { <span class="spin"></span> } @else { Submit & Continue }
                </button>
              </div>
            </div>
          }

          <!-- Step 4: Success -->
          @if (step() === 'success') {
            <div class="card">
              <div class="card-body center">
                <div class="check">✅</div>
                <h1>All set!</h1>
                <p class="desc">The business owner will reach out to you soon about this promotion.</p>
                <button class="btn" (click)="redirectToDestination()">Proceed to Offer →</button>
              </div>
            </div>
          }
          <div class="footer"><p>Powered by MarketSpase</p></div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:#f9fafb;color:#111827;font-family:Inter,-apple-system,BlinkMacSystemFont,system-ui,sans-serif}
    .loading,.error{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px;text-align:center;color:#4b5563}
    .error h2{color:#111827}.spinner{width:36px;height:36px;border:3px solid rgba(102,126,234,.2);border-top-color:#667eea;border-radius:50%;animation:spin .6s linear infinite;margin-bottom:16px}@keyframes spin{to{transform:rotate(360deg)}}
    .header{text-align:center;padding:20px 0 8px}.brand{font-weight:700;font-size:1.1rem;color:#667eea}
    .container{max-width:640px;margin:0 auto;padding:0 16px 80px}
    .card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .media{width:100%;max-height:320px;object-fit:cover;display:block}.media-placeholder{background:linear-gradient(135deg,#667eea,#764ba2);height:180px;display:flex;align-items:center;justify-content:center;font-size:3rem;opacity:.3}
    .card-body{padding:24px}.center{text-align:center;padding:40px 24px}.check{font-size:3rem;margin-bottom:16px}
    h1{font-size:1.35rem;font-weight:700;line-height:1.3;margin-bottom:8px}
    .meta{color:#4b5563;font-size:.85rem;display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}
    .badge{display:inline-flex;padding:2px 10px;border-radius:999px;font-size:.72rem;font-weight:600}.badge.leads{background:rgba(102,126,234,.12);color:#667eea}.badge.awareness{background:rgba(16,185,129,.12);color:#10b981}
    .cat{color:#9ca3af}.desc{color:#4b5563;font-size:.9rem;line-height:1.6;margin-bottom:20px}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px 24px;border:none;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer;margin-top:16px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff}.btn:hover{opacity:.92}.btn:disabled{opacity:.6;cursor:default}
    .btn.secondary{background:#f9fafb;color:#111827;border:1px solid #e5e7eb}.btn.success{background:#10b981}
    .choices{display:flex;flex-direction:column;gap:12px;margin-top:16px}@media(min-width:768px){.choices{flex-direction:row}h1{font-size:1.6rem}}
    .field{margin-bottom:16px}label{display:block;font-size:.82rem;font-weight:600;margin-bottom:6px}
    .input{width:100%;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;font-size:.95rem;outline:none;background:#f9fafb;box-sizing:border-box}.input:focus{border-color:#667eea;box-shadow:0 0 0 3px rgba(102,126,234,.12)}
    .hint{font-size:.78rem;color:#9ca3af;margin-top:8px}.err{font-size:.8rem;color:#ef4444;margin-top:6px}
    .promoter{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:.8rem;color:#9ca3af}.avatar{width:24px;height:24px;border-radius:50%;background:#667eea;color:#fff;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700}
    .footer{text-align:center;margin-top:32px;color:#9ca3af;font-size:.8rem}.spin{display:inline-block;width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite}
  `]
})
export class PublicCampaignComponent {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  readonly upi = signal('');
  readonly loading = signal(true);
  readonly error = signal('');
  readonly suspended = signal(false);
  readonly campaign = signal<any>(null);
  readonly goal = computed(() => this.campaign()?.promotionGoal || 'awareness');
  readonly step = signal('landing');
  readonly phone = signal('');
  readonly email = signal('');
  readonly formError = signal('');
  readonly submitting = signal(false);

  constructor() {
    this.upi.set(this.route.snapshot.paramMap.get('upi') || '');
    this.loadCampaign();
  }

  private loadCampaign(): void {
    this.http.get<any>(`/api/v1/campaign/landing/${this.upi()}`).subscribe({
      next: (r) => {
        if (!r.success || r.suspended) {
          this.suspended.set(true);
        } else {
          this.campaign.set(r.data);
        }
        this.loading.set(false);
      },
      error: () => { this.error.set('This link may be invalid or expired.'); this.loading.set(false); }
    });
  }

  handleContinue(): void {
    if (this.goal() === 'leads') { this.step.set('choice'); return; }
    this.redirectToDestination();
  }

  redirectToDestination(): void {
    window.location.href = `/api/v1/campaign/track/${this.upi()}?go=1`;
  }

  submitLead(): void {
    const p = this.phone().trim();
    this.formError.set('');
    if (!p) { this.formError.set('Please enter your phone number.'); return; }
    if (!/^[+]?[0-9]{10,15}$/.test(p.replace(/\s/g, ''))) { this.formError.set('Please enter a valid phone number.'); return; }
    this.submitting.set(true);
    this.http.post<any>(`/api/v1/campaign/lead/${this.upi()}`, { phone: p, email: this.email().trim() || undefined }).subscribe({
      next: () => { this.step.set('success'); this.submitting.set(false); },
      error: (e) => { this.formError.set(e.error?.message || 'Error. Please try again.'); this.submitting.set(false); }
    });
  }
}

@Component({
  selector: 'app-public-campaign-index',
  standalone: true,
  imports: [PublicCampaignComponent],
  template: `<app-public-campaign />`,
})
export class PublicCampaignIndexComponent {}
