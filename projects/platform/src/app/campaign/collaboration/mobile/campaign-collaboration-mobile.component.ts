import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CampaignCollaborationComponent } from '../collaboration.component';
import { CollaborationConversation } from '../collaboration.service';

type CollaborationMobileView = 'list' | 'chat';

@Component({
  selector: 'app-campaign-collaboration-mobile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TextFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  providers: [DatePipe, TitleCasePipe],
  templateUrl: './campaign-collaboration-mobile.component.html',
  styleUrls: ['./campaign-collaboration-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignCollaborationMobileComponent extends CampaignCollaborationComponent {
  protected readonly activeView = signal<CollaborationMobileView>('list');

  protected readonly latestThreads = computed(() => this.visibleConversations().slice(0, 6));
  protected readonly starterCampaignPreview = computed(() => this.starterCampaigns().slice(0, 4));
  protected readonly starterPromotionPreview = computed(() => this.starterPromotions().slice(0, 4));
  protected readonly collaboratorPreview = computed(() => this.recentCollaborators().slice(0, 5));

  protected showView(view: CollaborationMobileView): void {
    this.activeView.set(view);
  }

  protected openThread(conversation: CollaborationConversation): void {
    this.selectConversation(conversation);
    this.activeView.set('chat');
  }
}
