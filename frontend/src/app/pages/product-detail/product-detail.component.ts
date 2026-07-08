import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product, ProductVariant } from '../../models';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { StockNotificationService } from '../../core/services/stock-notification.service';
import { environment } from '../../../environments/environment';

@Component({ selector: 'app-product-detail', templateUrl: './product-detail.component.html', styleUrls: ['./product-detail.component.css'] })
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  selectedVariant: ProductVariant | null = null;
  quantity = 1;
  loading = true;
  addingToCart = false;
  notifyingMe = false;
  successMessage = '';
  notifyMeMessage = '';
  notifyMeError = '';
  notifyMeClicked = false;

  constructor(
    private route: ActivatedRoute, private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private stockNotificationService: StockNotificationService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(p => {
      this.productService.getProductById(+p['id']).subscribe(product => {
        this.product = product;
        if (product.variants?.length) this.selectedVariant = product.variants[0];
        this.notifyMeClicked = false;
        this.notifyMeMessage = '';
        this.notifyMeError = '';
        this.loading = false;
      });
    });
  }

  get displayPrice(): number {
    return this.selectedVariant?.price ?? this.product?.basePrice ?? 0;
  }

  get currentStock(): number {
    // if (environment.forceOutOfStockForTesting) return 0;
    return this.selectedVariant?.stock ?? this.product?.stockQuantity ?? 0;
  }

  get inStock(): boolean {
    return this.currentStock > 0;
  }

  handlePrimaryAction() {
    if (!this.inStock) {
      if (!this.authService.isLoggedIn) {
        this.notifyMeClicked = false;
        this.notifyMeMessage = '';
        this.notifyMeError = '';
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
        return;
      }

      this.notifyMe();
      return;
    }

    this.notifyMeClicked = false;
    this.notifyMeMessage = '';
    this.notifyMeError = '';
    this.addToCart();
  }

  notifyMe() {
    if (!this.product || !this.authService.currentUser) return;

    this.notifyingMe = true;
    this.notifyMeClicked = true;
    this.notifyMeMessage = '';
    this.notifyMeError = '';

    const sku = this.selectedVariant?.sku || this.product.code || `PROD-${this.product.id}`;
    const email = this.authService.currentUser.email;

    this.stockNotificationService.registerNotifyMe(sku, email).subscribe({
      next: (response: any) => {
        this.notifyingMe = false;
        if (response.success) {
          this.notifyMeMessage = response.message;
        } else {
          this.notifyMeError = response.message || 'Failed to subscribe. Please try again.';
        }
        setTimeout(() => {
          this.notifyMeMessage = '';
          this.notifyMeError = '';
        }, 5000);
      },
      error: (err) => {
        this.notifyingMe = false;
        this.notifyMeError = 'Failed to subscribe. Please try again.';
        console.error('Notify Me Error:', err);
        setTimeout(() => this.notifyMeError = '', 5000);
      }
    });
  }

  addToCart() {
    if (!this.product) return;
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.addingToCart = true;
    this.cartService.addEntry({
      productId: this.product.id,
      variantId: this.selectedVariant?.id,
      quantity: this.quantity
    }).subscribe({
      next: () => {
        this.addingToCart = false;
        this.successMessage = 'Added to cart!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => this.addingToCart = false
    });
  }
}


