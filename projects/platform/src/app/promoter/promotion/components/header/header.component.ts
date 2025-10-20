import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { HelpDialogComponent } from '../../../../../../../shared-services/src/public-api';

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

  showDescription() {
    this.dialog.open(HelpDialogComponent, {
      data: { 
        help: `
          <h3>Promotion Guide</h3>
          <p>Follow these 5 simple steps to complete your ad promotion and get paid automatically.</p>
          <br>

          <h4>Step 1 – Create Your Account</h4>
          <p>Switch user role to promoter. Ensure your profile is verified, and set up your payment method. 
          It takes less than 2 minutes to get started.</p>
          <br>

          <h4>Step 2 – Browse Available Campaigns</h4>
          <p>Go to the <strong>Promotion</strong> section and explore available promotions. </p>
          <br>

          <h4>Step 3 – Share on WhatsApp Status</h4>
          <p>Download the campaign’s branded image or video, then post it on your WhatsApp Status. 
          Keep it live for <strong>24 hours</strong> without deleting or editing it.</p>
          <br>

          <h4>Step 4 – Submit Proof</h4>
          <p>After at least 23 hours, take a screenshot or short screen recording showing:</p>
          <ul>
            <li>The <strong>view count</strong></li>
            <li>The <strong>time and date</strong></li>
            <li>The campaign’s <strong>promotion ID</strong></li>
          </ul>
          <p>Upload your proof using the <strong>Submit Proof</strong> button on the campaign page.</p>
          <br>

          <h4>Step 5 – Get Paid Automatically</h4>
          <p>Once your post has at least <strong>25+ views</strong> and remains live for 24 hours, 
          the system verifies your post automatically and credits your wallet. 
          You can then withdraw your earnings from your wallet into your preferred payment method.</p>
          <br>
          
          <h4>Tips for Success</h4>
          <ul>
            <li>Post during peak hours for maximum engagement.</li>
            <li>Ensure screenshots or recordings are clear.</li>
            <li>Keep your payment details updated to avoid delays.</li>
          </ul>
        `
      },
    });
  }

}