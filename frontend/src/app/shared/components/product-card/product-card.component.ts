import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../../models';
import { AuthService } from '../../../core/services/auth.service';
import { WishlistService } from '../../../core/services/wishlist.service';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css']
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Input() showCompare = false;
  @Input() compareChecked = false;
  @Input() compareDisabled = false;
  @Output() compareToggled = new EventEmitter<boolean>();
  toggling = false;

  constructor(
    private authService: AuthService,
    private wishlistService: WishlistService,
    private router: Router
  ) {}

  get isWishlisted(): boolean {
    return this.wishlistService.isWishlisted(this.product.id, undefined, true);
  }

  toggleWishlist(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.authService.isLoggedIn) {
      const shouldNavigate = window.confirm('Please log in to use your wishlist. Go to login now?');
      if (shouldNavigate) {
        this.router.navigate(['/login']);
      }
      return;
    }

    this.toggling = true;
    this.wishlistService.toggleEntry({ productId: this.product.id }).subscribe({
      next: () => {
        this.toggling = false;
      },
      error: () => {
        this.toggling = false;
      }
    });
  }

  onCompareChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.compareToggled.emit(target.checked);
  }
}
