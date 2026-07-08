import { Component, Input } from '@angular/core';
import { Product } from '../../../models';

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

  private get firstVariantId(): number | undefined {
    return this.product.variants?.[0]?.id;
  }

  get isWishlisted(): boolean {
    return this.wishlistService.isWishlisted(this.product.id, this.firstVariantId);
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
    this.wishlistService.toggleEntry({
      productId: this.product.id,
      variantId: this.firstVariantId
    }).subscribe({
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
