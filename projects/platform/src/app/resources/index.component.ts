import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoadingService } from './loading.service';
import { AboutSkeletonComponent } from './loading-skeleton/loading-skeleton.component';

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

  ngOnInit() {
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
          // A navigation has started, show the loader
          this.loadingService.show();
        } else if (event instanceof NavigationEnd || 
                   event instanceof NavigationCancel || 
                   event instanceof NavigationError) {
          // Navigation completed successfully, or was cancelled/failed, hide the loader
          this.loadingService.hide();
        }
      });
  }
}