import {
  Component, Input, OnInit, OnDestroy, ElementRef, ViewChild,
  HostListener, AfterViewInit, ChangeDetectorRef
} from '@angular/core';
import { Product } from '../../../models';

@Component({
  selector: 'app-product-carousel',
  templateUrl: './product-carousel.component.html',
  styleUrls: ['./product-carousel.component.css']
})
export class ProductCarouselComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() products: Product[] = [];
  @Input() title = 'Products';
  @Input() viewAllLink = '/products';
  @Input() showViewAll = true;

  @ViewChild('track') trackEl!: ElementRef<HTMLDivElement>;

  currentIndex = 0;
  visibleCount = 4;
  totalDots = 1;

  // Touch/swipe state
  private touchStartX = 0;
  private touchEndX = 0;
  private isSwiping = false;
  private swipeThreshold = 50;

  private resizeObserver?: ResizeObserver;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.calculateVisibleCount();
    this.calculateDots();
  }

  ngAfterViewInit() {
    // Use ResizeObserver for responsive recalculation
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.calculateVisibleCount();
        this.calculateDots();
        this.clampIndex();
        this.cdr.detectChanges();
      });
      this.resizeObserver.observe(this.trackEl.nativeElement.parentElement!);
    }
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  @HostListener('window:resize')
  onResize() {
    this.calculateVisibleCount();
    this.calculateDots();
    this.clampIndex();
  }

  get maxIndex(): number {
    return Math.max(0, this.products.length - this.visibleCount);
  }

  get translateX(): number {
    if (!this.trackEl?.nativeElement) return 0;
    const cardWidth = 100 / this.visibleCount;
    return -(this.currentIndex * cardWidth);
  }

  get canGoNext(): boolean {
    return this.currentIndex < this.maxIndex;
  }

  get canGoPrev(): boolean {
    return this.currentIndex > 0;
  }

  next(): void {
    if (this.canGoNext) {
      this.currentIndex++;
    }
  }

  prev(): void {
    if (this.canGoPrev) {
      this.currentIndex--;
    }
  }

  goToSlide(dotIndex: number): void {
    this.currentIndex = Math.min(dotIndex * this.visibleCount, this.maxIndex);
  }

  getActiveDot(): number {
    return Math.floor(this.currentIndex / this.visibleCount);
  }

  // Touch event handlers for swipe support
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
    this.isSwiping = true;
  }

  onTouchMove(event: TouchEvent): void {
    if (this.isSwiping) {
      this.touchEndX = event.changedTouches[0].screenX;
    }
  }

  onTouchEnd(): void {
    if (!this.isSwiping) return;
    this.isSwiping = false;
    const diff = this.touchStartX - this.touchEndX;
    if (Math.abs(diff) > this.swipeThreshold) {
      if (diff > 0) {
        this.next();
      } else {
        this.prev();
      }
    }
  }

  // Keyboard navigation for accessibility
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.prev();
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      this.next();
      event.preventDefault();
    }
  }

  private calculateVisibleCount(): void {
    const width = window.innerWidth;
    if (width < 768) {
      this.visibleCount = 1;      // Mobile: 1 product
    } else if (width < 992) {
      this.visibleCount = 2;      // Tablet: 2 products
    } else {
      this.visibleCount = 4;      // Desktop: 4 products
    }
  }

  private calculateDots(): void {
    this.totalDots = Math.ceil(this.products.length / this.visibleCount);
  }

  private clampIndex(): void {
    if (this.currentIndex > this.maxIndex) {
      this.currentIndex = this.maxIndex;
    }
  }
}
