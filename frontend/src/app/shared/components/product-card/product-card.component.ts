import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../../models';
import { AuthService } from '../../../core/services/auth.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { isLowStock } from '../../constants/stock.constants';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css']
})
export class ProductCardComponent {
  @Input() product!: Product;
  toggling = false;

  constructor(
    private authService: AuthService,
    private wishlistService: WishlistService,
    private router: Router
  ) {}

  get isLowStock(): boolean {
    return isLowStock(this.product.availableQuantity, this.product.lowStockThreshold);
  }

  get isOutOfStock(): boolean {
    return this.product.availableQuantity === 0;
  }

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
}
