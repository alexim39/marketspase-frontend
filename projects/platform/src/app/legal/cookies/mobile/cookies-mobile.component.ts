import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CookiesComponent } from '../cookies.component';

type CookieSheet = 'topic' | 'controls' | 'links' | null;

interface CookieStat {
  icon: string;
  value: string;
  label: string;
}

interface CookieTopic {
  icon: string;
  title: string;
  summary: string;
  detail: string;
  bullets: string[];
}

interface BrowserControl {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-cookies-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './cookies-mobile.component.html',
  styleUrls: ['./cookies-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookiesMobileComponent extends CookiesComponent {
  protected readonly activeSheet = signal<CookieSheet>(null);
  protected readonly selectedTopic = signal<CookieTopic | null>(null);

  protected readonly cookieStats: CookieStat[] = [
    { icon: 'cookie', value: 'Small files', label: 'What cookies are' },
    { icon: 'settings_suggest', value: 'Preferences', label: 'What they save' },
    { icon: 'analytics', value: 'Insights', label: 'Why they help' },
    { icon: 'tune', value: 'Browser', label: 'Your control' },
  ];

  protected readonly topics: CookieTopic[] = [
    {
      icon: 'cookie',
      title: 'What cookies are',
      summary: 'Cookies are small text files stored on your device when you visit a website.',
      detail: 'MarketSpase may use cookies or similar technologies to recognize returning visitors and keep useful preferences or information available when users come back.',
      bullets: ['Stored by your browser', 'Can remember preferences', 'Can make return visits faster'],
    },
    {
      icon: 'insights',
      title: 'How cookies help the website',
      summary: 'Cookies can help analyze trends, administer the website, and understand how visitors move around.',
      detail: 'Cookie data can help MarketSpase understand aggregate visitor behavior, improve content and flows, and continue developing a better website experience.',
      bullets: ['Understand visitor movement', 'Improve website performance', 'Support product decisions'],
    },
    {
      icon: 'campaign',
      title: 'Advertising cookies',
      summary: 'Advertising featured on the website may use cookies outside MarketSpase control.',
      detail: 'If advertisements on the website use cookies, those cookies may be downloaded when users click ads. MarketSpase states that it does not control those external advertising cookies.',
      bullets: ['May come from ad providers', 'Can activate after ad clicks', 'External cookies may have separate rules'],
    },
    {
      icon: 'block',
      title: 'Declining or deleting cookies',
      summary: 'You can decline or delete cookies through your browser settings.',
      detail: 'Most browsers let users block new cookies or delete existing cookies. Some areas of the website may not work fully when cookies are disabled.',
      bullets: ['Block cookies in browser settings', 'Delete existing cookies', 'Some website areas may be limited'],
    },
    {
      icon: 'open_in_new',
      title: 'Learn more',
      summary: 'The policy points users to All About Cookies for general cookie guidance.',
      detail: 'For general education about cookies, the desktop policy links to All About Cookies. The mobile page keeps that external reference available as a clear action.',
      bullets: ['Read independent guidance', 'Review browser-specific steps', 'Use privacy settings that fit you'],
    },
  ];

  protected readonly browserControls: BrowserControl[] = [
    {
      icon: 'visibility_off',
      title: 'Block cookies',
      description: 'Use your browser privacy settings to block some or all cookies.',
    },
    {
      icon: 'delete_sweep',
      title: 'Delete cookies',
      description: 'Clear cookies already stored on your device when needed.',
    },
    {
      icon: 'restart_alt',
      title: 'Expect feature impact',
      description: 'Some website areas may not work fully when cookies are disabled.',
    },
  ];

  protected openTopic(topic: CookieTopic): void {
    this.selectedTopic.set(topic);
    this.activeSheet.set('topic');
  }

  protected openControls(): void {
    this.activeSheet.set('controls');
  }

  protected openLinks(): void {
    this.activeSheet.set('links');
  }

  protected closeSheet(): void {
    this.activeSheet.set(null);
    this.selectedTopic.set(null);
  }
}
