import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  template: `
    <span class="star-rating">
      <span *ngFor="let star of [1,2,3,4,5]" [class.filled]="star <= Math.round(rating)">★</span>
      <span class="rating-text ms-2">
        <span class="rating-value">{{ rating.toFixed(1) }}</span>
        <span *ngIf="count > 0" class="text-muted ms-1 small">({{ count }} {{ count === 1 ? 'review' : 'reviews' }})</span>
      </span>
    </span>
  `,
  styles: [`
    .star-rating {
      display: inline-flex;
      align-items: center;
    }
    span {
      color: #FFB800;
      font-size: 1.2rem;
      line-height: 1;
    }
    span.filled {
      color: #FFB800;
    }
    span:not(.filled) {
      color: #d4d4d4;
    }
    .rating-text {
      font-size: 0.9rem;
    }
    .rating-value {
      font-weight: bold;
    }
  `]
})
export class StarRatingComponent {
  @Input() rating = 0;
  @Input() count = 0;
  Math = Math;
}
