import { Directive, ElementRef, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, takeUntil, throttleTime } from 'rxjs/operators';

@Directive({
  selector: '[appInfiniteScroll]',
  standalone: true
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private destroy$ = new Subject<void>();

  @Input() scrollThreshold = 100; // pixels from bottom to trigger load
  @Input() scrollDebounceTime = 300; // ms
  @Input() scrollEnabled = true;

  @Output() scrolled = new EventEmitter<void>();

  ngOnInit(): void {
    fromEvent(window, 'scroll')
      .pipe(
        throttleTime(this.scrollDebounceTime),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.onScroll());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private onScroll(): void {
    if (!this.scrollEnabled) return;

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollPosition = scrollTop + windowHeight;

    if (documentHeight - scrollPosition <= this.scrollThreshold) {
      this.scrolled.emit();
    }
  }
}