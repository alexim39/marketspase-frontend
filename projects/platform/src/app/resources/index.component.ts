import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { AboutSkeletonComponent } from './loading-skeleton/loading-skeleton.component';
import { LoadingService } from '@shared/services';

@Component({
    selector: 'app-resources-index',
    providers: [LoadingService],
    imports: [RouterModule, CommonModule, AboutSkeletonComponent],
    template: `
    @if (loadingService.isLoading$ | async) {
      <app-about-skeleton [targetUrl]="loadingTargetUrl()"/>
    } @else {
      <router-outlet/>
    }
    
    `,
   
})
export class ResourcesIndexComponent {
    private readonly destroyRef = inject(DestroyRef);
    readonly loadingTargetUrl = signal('');

    constructor(
    private router: Router,
    public loadingService: LoadingService // Made public for use in the template
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(
        // We only care about navigation-related events
        filter(event => event instanceof NavigationStart || 
                       event instanceof NavigationEnd || 
                       event instanceof NavigationCancel || 
                       event instanceof NavigationError),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.loadingTargetUrl.set(event.url);
          this.loadingService.show();
        } else if (event instanceof NavigationEnd) { // Only successful navigation
          this.loadingService.hide();
          this.loadingTargetUrl.set(event.urlAfterRedirects || event.url);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (event instanceof NavigationCancel || 
                  event instanceof NavigationError) {
          // Optionally handle cancelled or errored navigation separately
          this.loadingService.hide();
        }
      });
  }
}
