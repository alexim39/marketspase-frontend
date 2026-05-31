import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AiAssistantService } from '../../../services/ai-assistant.service';
import { FAQ, FaqsComponent } from '../faqs.component';

type FaqSheet = 'add' | 'edit' | 'filter' | 'delete' | null;

@Component({
  selector: 'app-faqs-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './faqs-mobile.component.html',
  styleUrls: ['./faqs-mobile.component.scss'],
  providers: [AiAssistantService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqsMobileComponent extends FaqsComponent {
  protected readonly activeSheet = signal<FaqSheet>(null);
  protected readonly pendingDelete = signal<FAQ | null>(null);
  protected readonly visibleCount = signal(8);

  protected readonly visibleFaqs = computed(() => this.filteredFaqs().slice(0, this.visibleCount()));
  protected readonly hiddenFaqCount = computed(() => Math.max(this.filteredFaqs().length - this.visibleFaqs().length, 0));
  protected readonly trainingScore = computed(() => Math.min(100, Math.round((this.faqs().length / 12) * 100)));
  protected readonly answerCoverageLabel = computed(() => {
    const count = this.faqs().length;
    if (count >= 12) return 'Strong coverage';
    if (count >= 6) return 'Growing coverage';
    if (count > 0) return 'Needs more answers';
    return 'No training yet';
  });

  protected openAddSheet(): void {
    this.cancelEdit();
    this.activeSheet.set('add');
  }

  protected openEditSheet(faq: FAQ): void {
    this.startEdit(faq);
    this.activeSheet.set('edit');
  }

  protected openFilterSheet(): void {
    this.activeSheet.set('filter');
  }

  protected requestDelete(faq: FAQ): void {
    this.pendingDelete.set(faq);
    this.activeSheet.set('delete');
  }

  protected confirmDelete(): void {
    const faq = this.pendingDelete();
    if (!faq) return;

    this.removeFaq(faq._id);
    this.pendingDelete.set(null);
    this.activeSheet.set(null);
  }

  protected closeSheet(): void {
    if (this.activeSheet() === 'edit') {
      this.cancelEdit();
    }

    this.pendingDelete.set(null);
    this.activeSheet.set(null);
  }

  protected showMore(): void {
    this.visibleCount.update(count => count + 8);
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.selectCategory();
  }
}
