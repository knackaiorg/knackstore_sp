import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product, ProductVariant, ReviewEligibilityDTO, ReviewListWsDTO, ReviewWsDTO } from '../../models';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { StockNotificationService } from '../../core/services/stock-notification.service';
import { environment } from '../../../environments/environment';
import { ProductReviewService } from 'src/app/core/services/product-review.service';

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
  reviews: ReviewWsDTO[] = [];
  reviewsLoading = true;
  submittingReview = false;
  reviewRating: number | null = null;
  reviewComment = '';
  reviewError = '';
  reviewSuccessMessage = '';
  averageRating = 0;
  totalReviewCount = 0;
  alreadyReviewed = false;
  checkingEligibility = false;


  constructor(
    private route: ActivatedRoute, private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private stockNotificationService: StockNotificationService,
    private productReviewService: ProductReviewService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(p => {
      const productId = +p['id'];
      this.productService.getProductById(productId).subscribe(product => {
        this.product = product;
        if (product.variants?.length) this.selectedVariant = product.variants[0];
        this.notifyMeClicked = false;
        this.notifyMeMessage = '';
        this.notifyMeError = '';
        this.loading = false;
      });

      this.loadReviews(productId);
      if (this.isAuthenticated) {
        this.checkReviewEligibility(productId);
      }
    });
  }

  get isAuthenticated(): boolean {
    return this.authService.isLoggedIn;
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

  setReviewRating(star: number): void {
    this.reviewRating = star;
    this.reviewError = '';
  }

  submitReview(): void {
    if (!this.product) return;

    this.reviewError = '';
    this.reviewSuccessMessage = '';

    if (this.reviewRating == null) {
      this.reviewError = 'Please select a star rating before submitting your review.';
      return;
    }

    this.submittingReview = true;
    this.productReviewService.submitReview(this.product.id, {
      rating: this.reviewRating,
      comment: this.reviewComment?.trim() || undefined
    }).subscribe({
      next: (review) => {
        this.submittingReview = false;
        this.reviews = [review, ...this.reviews];
        
        // Update product stats
        if (this.product) {
          this.totalReviewCount = this.totalReviewCount + 1;
          this.averageRating = Math.round(((this.averageRating * (this.totalReviewCount - 1)) + review.rating) / this.totalReviewCount * 10) / 10;
          this.product.reviewCount = this.totalReviewCount;
          this.product.averageRating = this.averageRating;
        }

        this.reviewRating = null;
        this.reviewComment = '';
        this.reviewSuccessMessage = 'Thanks! Your review has been published.';
        this.alreadyReviewed = true;
      },
      error: (err) => {
        this.submittingReview = false;
        this.reviewError = err?.error?.message || 'Unable to submit review right now. Please try again.';
      }
    });
  }

  private loadReviews(productId: number): void {
    this.reviewsLoading = true;
    this.productReviewService.getProductReviews(productId).subscribe({
      next: (reviewList: ReviewListWsDTO) => {
        this.reviews = reviewList.reviews;
        this.averageRating = reviewList.averageRating;
        this.totalReviewCount = reviewList.totalCount;
        this.reviewsLoading = false;
      },
      error: () => {
        this.reviews = [];
        this.averageRating = 0;
        this.totalReviewCount = 0;
        this.reviewsLoading = false;
      }
    });
  }

  private checkReviewEligibility(productId: number): void {
    this.checkingEligibility = true;
    this.productReviewService.getReviewEligibility(productId).subscribe({
      next: (eligibility: ReviewEligibilityDTO) => {
        this.alreadyReviewed = eligibility.alreadyReviewed;
        this.checkingEligibility = false;
      },
      error: () => {
        this.alreadyReviewed = false;
        this.checkingEligibility = false;
      }
    });
  }
}


