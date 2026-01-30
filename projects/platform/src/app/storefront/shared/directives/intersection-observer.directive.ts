// shared/directives/intersection-observer.directive.ts
import { 
  Directive, 
  ElementRef, 
  EventEmitter, 
  Output, 
  OnInit, 
  OnDestroy, 
  Input, 
  NgZone 
} from '@angular/core';

export interface IntersectionOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
  triggerOn?: 'enter' | 'exit' | 'both';
}

@Directive({
  selector: '[appIntersectionObserver]',
  standalone: true,
  exportAs: 'intersection'
})
export class IntersectionObserverDirective implements OnInit, OnDestroy {
  @Input() options: IntersectionOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
    once: false,
    triggerOn: 'enter'
  };
  
  @Output() visible = new EventEmitter<boolean>();
  @Output() intersect = new EventEmitter<IntersectionObserverEntry>();
  
  private observer!: IntersectionObserver;
  private hasTriggered: boolean = false;

  constructor(
    private el: ElementRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.initObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private initObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      this.ngZone.run(() => {
        this.visible.emit(true);
        this.intersect.emit({
          boundingClientRect: this.el.nativeElement.getBoundingClientRect(),
          intersectionRatio: 1,
          intersectionRect: this.el.nativeElement.getBoundingClientRect(),
          isIntersecting: true,
          rootBounds: null,
          target: this.el.nativeElement,
          time: Date.now()
        } as IntersectionObserverEntry);
      });
      return;
    }

    const options: IntersectionObserverInit = {
      root: this.options.root,
      rootMargin: this.options.rootMargin,
      threshold: this.options.threshold
    };

    this.ngZone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          this.ngZone.run(() => {
            this.intersect.emit(entry);
            
            const shouldTrigger = this.shouldTrigger(entry.isIntersecting);
            
            if (shouldTrigger) {
              this.visible.emit(entry.isIntersecting);
              
              if (this.options.once && this.options.triggerOn === 'enter' && entry.isIntersecting) {
                this.hasTriggered = true;
                this.observer.unobserve(entry.target);
              }
            }
          });
        });
      }, options);

      this.observer.observe(this.el.nativeElement);
    });
  }

  private shouldTrigger(isIntersecting: boolean): boolean {
    if (this.options.once && this.hasTriggered) {
      return false;
    }
    
    switch (this.options.triggerOn) {
      case 'enter':
        return isIntersecting;
      case 'exit':
        return !isIntersecting;
      case 'both':
        return true;
      default:
        return isIntersecting;
    }
  }

  // Public API
  observe(): void {
    if (this.observer && this.el.nativeElement) {
      this.observer.observe(this.el.nativeElement);
    }
  }

  unobserve(): void {
    if (this.observer && this.el.nativeElement) {
      this.observer.unobserve(this.el.nativeElement);
    }
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  // Utility methods
  isInViewport(): boolean {
    const rect = this.el.nativeElement.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.bottom >= 0 &&
      rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
      rect.right >= 0
    );
  }

  getVisibilityRatio(): number {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    
    if (rect.bottom < 0 || rect.top > viewportHeight) {
      return 0;
    }
    
    const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
    return visibleHeight / rect.height;
  }
}