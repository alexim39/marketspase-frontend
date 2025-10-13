import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AboutSkeletonComponent } from './loading-skeleton/loading-skeleton.component';
import { LoadingService } from '../../../../shared-services/src/public-api';

@Component({
    selector: 'app-resources-index',
    providers: [LoadingService],
    imports: [RouterModule, CommonModule, AboutSkeletonComponent],
    template: `
    @if (loadingService.isLoading$ | async) {
        <app-about-skeleton/>
    }    
    <router-outlet/>
    `,
   
})
export class ResourcesIndexComponent {
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
                       event instanceof NavigationError)
      )
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.loadingService.show();
        } else if (event instanceof NavigationEnd) { // Only successful navigation
          this.loadingService.hide();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (event instanceof NavigationCancel || 
                  event instanceof NavigationError) {
          // Optionally handle cancelled or errored navigation separately
          this.loadingService.hide();
        }
      });
  }
}