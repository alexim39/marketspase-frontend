import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { HelpDialogComponent } from '@shared/services';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input({ required: true }) title!: string;
  readonly dialog = inject(MatDialog);

  showDescription(): void {
    this.dialog.open(HelpDialogComponent, {
      data: { 
        help: `
          <h3>Promotion Guide</h3>
          <p>Follow these simple steps to share tracked promotion links and earn from valid clicks.</p>
          <br>

          <h4>Step 1 - Create Your Account</h4>
          <p>Switch user role to promoter. Ensure your profile is verified, and set up your payment method.</p>
          <br>

          <h4>Step 2 - Browse Available Campaigns</h4>
          <p>Go to the <strong>Promotion</strong> section and explore available campaigns.</p>
          <br>

          <h4>Step 3 - Accept a Campaign</h4>
          <p>Accepting a campaign generates your unique UPI and tracked promotion link.</p>
          <br>

          <h4>Step 4 - Share Your Link</h4>
          <p>Copy the caption or link from your promotion card and share it on WhatsApp, social media, or any approved channel.</p>
          <ul>
            <li>Keep the UPI in the caption.</li>
            <li>Use the generated MarketSpase link.</li>
            <li>Do not replace it with the campaign destination URL.</li>
          </ul>
          <br>

          <h4>Step 5 - Earn Per Valid Click</h4>
          <p>MarketSpase tracks clicks in real time. Each valid click increases your earnings while the campaign budget still has funds.</p>
          <br>
          
          <h4>Tips for Success</h4>
          <ul>
            <li>Post during peak hours for maximum engagement.</li>
            <li>Use clear captions that tell people why they should click.</li>
            <li>Keep your payment details updated to avoid delays.</li>
          </ul>
        `
      },
    });
  }
}
