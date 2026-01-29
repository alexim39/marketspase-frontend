// shared/directives/lazy-image.directive.ts
import { 
  Directive, 
  ElementRef, 
  Input, 
  OnInit, 
  OnDestroy, 
  Renderer2, 
  NgZone 
} from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Directive({
  selector: '[appLazyImage]',
  standalone: true
})
export class LazyImageDirective implements OnInit, OnDestroy {
  @Input() src: string = '';
  @Input() defaultImage: string = 'assets/images/placeholder.svg';
  @Input() errorImage: string = 'assets/images/error.svg';
  @Input() threshold: number = 0.1;
  @Input() rootMargin: string = '50px';
  
  private observer!: IntersectionObserver;
  private scrollSub!: Subscription;
  private resizeSub!: Subscription;
  private loaded: boolean = false;
  
  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // Set default placeholder
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.defaultImage);
    this.renderer.setAttribute(this.el.nativeElement, 'data-src', this.src);
    
    // Add loading class
    this.renderer.addClass(this.el.nativeElement, 'lazy-image');
    this.renderer.addClass(this.el.nativeElement, 'loading');
    
    // Initialize intersection observer
    this.initObserver();
    
    // Set up scroll and resize listeners as fallback
    this.setupEventListeners();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    if (this.scrollSub) {
      this.scrollSub.unsubscribe();
    }
    
    if (this.resizeSub) {
      this.resizeSub.unsubscribe();
    }
  }

  private initObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      this.loadImage();
      return;
    }

    const options = {
      root: null,
      rootMargin: this.rootMargin,
      threshold: this.threshold
    };

    this.ngZone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.loaded) {
            this.loadImage();
            this.observer.unobserve(entry.target);
          }
        });
      }, options);

      this.observer.observe(this.el.nativeElement);
    });
  }

  private setupEventListeners(): void {
    // Debounce scroll events
    this.scrollSub = fromEvent(window, 'scroll')
      .pipe(debounceTime(100))
      .subscribe(() => {
        if (!this.loaded && this.isInViewport()) {
          this.loadImage();
        }
      });

    // Debounce resize events
    this.resizeSub = fromEvent(window, 'resize')
      .pipe(debounceTime(100))
      .subscribe(() => {
        if (!this.loaded && this.isInViewport()) {
          this.loadImage();
        }
      });
  }

  private loadImage(): void {
    this.loaded = true;
    this.renderer.removeClass(this.el.nativeElement, 'loading');
    this.renderer.addClass(this.el.nativeElement, 'loaded');
    
    const img = new Image();
    img.src = this.src;
    
    img.onload = () => {
      this.ngZone.run(() => {
        this.renderer.setAttribute(this.el.nativeElement, 'src', this.src);
        this.renderer.addClass(this.el.nativeElement, 'loaded');
        this.renderer.removeClass(this.el.nativeElement, 'error');
      });
    };
    
    img.onerror = () => {
      this.ngZone.run(() => {
        this.renderer.setAttribute(this.el.nativeElement, 'src', this.errorImage);
        this.renderer.addClass(this.el.nativeElement, 'error');
        this.renderer.removeClass(this.el.nativeElement, 'loaded');
      });
    };
  }

  private isInViewport(): boolean {
    const rect = this.el.nativeElement.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.bottom >= 0 &&
      rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
      rect.right >= 0
    );
  }

  // Public API
  load(): void {
    if (!this.loaded) {
      this.loadImage();
    }
  }

  reset(): void {
    this.loaded = false;
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.defaultImage);
    this.renderer.addClass(this.el.nativeElement, 'loading');
    this.renderer.removeClass(this.el.nativeElement, 'loaded');
    this.renderer.removeClass(this.el.nativeElement, 'error');
    
    // Re-observe if needed
    if (this.observer) {
      this.observer.observe(this.el.nativeElement);
    }
  }
}