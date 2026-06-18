import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product, ProductReview, ProductVariant } from '../../models';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductReviewService } from '../../core/services/product-review.service';

@Component({ selector: 'app-product-detail', templateUrl: './product-detail.component.html', styleUrls: ['./product-detail.component.css'] })
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  selectedVariant: ProductVariant | null = null;
  quantity = 1;
  loading = true;
  addingToCart = false;
  successMessage = '';
  reviews: ProductReview[] = [];
  reviewsLoading = true;
  submittingReview = false;
  reviewRating: number | null = null;
  reviewComment = '';
  reviewError = '';
  reviewSuccessMessage = '';

  constructor(
    private route: ActivatedRoute, private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private productReviewService: ProductReviewService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(p => {
      const productId = +p['id'];
      this.productService.getProductById(productId).subscribe(product => {
        this.product = product;
        if (product.variants?.length) this.selectedVariant = product.variants[0];
        this.loading = false;
      });

      this.loadReviews(productId);
    });
  }

  get isAuthenticated(): boolean {
    return this.authService.isLoggedIn;
  }

  get displayPrice(): number {
    return this.selectedVariant?.price ?? this.product?.basePrice ?? 0;
  }

  get inStock(): boolean {
    return (this.selectedVariant?.stock ?? this.product?.stockQuantity ?? 0) > 0;
  }

  addToCart() {
    if (!this.product) return;
    if (!this.authService.isLoggedIn) { this.router.navigate(['/login']); return; }
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

        if (this.product) {
          const totalCount = this.product.reviewCount + 1;
          const updatedAverage = Math.round(((this.product.averageRating * this.product.reviewCount) + review.rating) / totalCount);
          this.product.reviewCount = totalCount;
          this.product.averageRating = updatedAverage;
        }

        this.reviewRating = null;
        this.reviewComment = '';
        this.reviewSuccessMessage = 'Thanks! Your review has been published.';
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
      next: (reviews) => {
        this.reviews = reviews;
        this.reviewsLoading = false;
      },
      error: () => {
        this.reviews = [];
        this.reviewsLoading = false;
      }
    });
  }
}
