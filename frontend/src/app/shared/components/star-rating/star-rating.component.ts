import { Component, Input } from '@angular/core';
@Component({
  selector: 'app-star-rating',
  template: `<span>{{ stars }}</span> <small class="text-muted">({{ count }})</small>`,
})
export class StarRatingComponent {
  @Input() rating = 0;
  @Input() count = 0;
  get stars(): string {
    return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
  }
}
