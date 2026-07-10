import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { Cart, Product, ProductQuestion, ProductReview, ProductVariant } from '../../models';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductReviewService } from '../../core/services/product-review.service';
import { ProductQuestionService } from '../../core/services/product-question.service';
import { RecentlyViewedService } from '../../core/services/recently-viewed.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { StockNotificationService } from 'src/app/core/services/stock-notification.service';
import { isLowStock } from '../../shared/constants/stock.constants';

@Component({ selector: 'app-product-detail', templateUrl: './product-detail.component.html', styleUrls: ['./product-detail.component.css'] })
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  selectedVariant: ProductVariant | null = null;
  quantity = 1;
  loading = true;
  addingToCart = false;
  successMessage = '';
  wishlistMessage = '';
  togglingWishlist = false;
  reviews: ProductReview[] = [];
  reviewsLoading = true;
  questions: ProductQuestion[] = [];
  questionsLoading = true;
  questionText = '';
  questionError = '';
  questionSuccessMessage = '';
  submittingQuestion = false;
  answerTextByQuestionId: Record<number, string> = {};
  answerErrorByQuestionId: Record<number, string> = {};
  answerSuccessByQuestionId: Record<number, string> = {};
  answerLoadingByQuestionId: Record<number, boolean> = {};
  submittingReview = false;
  reviewRating: number | null = null;
  reviewComment = '';
  reviewError = '';
  reviewSuccessMessage = '';
  notifyMeMessage = '';
  notifyMeClicked = false;
  addToCartError = '';
  reservationCountdown = '';
  reservedQuantity = 0;
  private latestCart: Cart | null = null;
  private cartSub?: Subscription;
  private countdownSub?: Subscription;
  constructor(
    private route: ActivatedRoute, private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private productReviewService: ProductReviewService,
    private productQuestionService: ProductQuestionService,
    private recentlyViewedService: RecentlyViewedService,
    private wishlistService: WishlistService,
    private stockNotificationService: StockNotificationService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(p => {
      const productId = +p['id'];
      this.productService.getProductById(productId).subscribe(product => {
        this.product = product;
        if (product.variants?.length) this.selectedVariant = product.variants[0];
        this.notifyMeClicked = false;
        this.notifyMeMessage = '';
        this.loading = false;
        this.recentlyViewedService.addProduct(product);
      });

      this.loadReviews(productId);
      this.loadQuestions(productId);
    });

    this.cartSub = this.cartService.cart$.subscribe(cart => this.latestCart = cart);
    if (this.authService.isLoggedIn) {
      this.cartService.loadCart().subscribe();
    }
    this.countdownSub = interval(1000).subscribe(() => this.updateReservationCountdown());
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
    this.countdownSub?.unsubscribe();
  }

  private updateReservationCountdown(): void {
    const entry = this.latestCart?.entries.find(e =>
      e.productId === this.product?.id &&
      (this.selectedVariant ? e.variantId === this.selectedVariant.id : !e.variantId)
    );

    const msRemaining = entry?.reservedUntil ? new Date(entry.reservedUntil).getTime() - Date.now() : 0;
    if (msRemaining <= 0) {
      this.reservationCountdown = '';
      this.reservedQuantity = 0;
      return;
    }

    const totalSeconds = Math.floor(msRemaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    this.reservationCountdown = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    this.reservedQuantity = entry!.quantity;
  }

  get currentStock(): number {
    // if (environment.forceOutOfStockForTesting) return 0;
    return this.selectedVariant?.availableStock ?? this.product?.availableQuantity ?? 0;
  }
  get isAuthenticated(): boolean {
    return this.authService.isLoggedIn;
  }

  get questionCharCount(): number {
    return this.questionText.length;
  }

  get hasAskedQuestion(): boolean {
    if (!this.isAuthenticated) {
      return false;
    }

    const currentUser = this.authService.currentUser;
    return this.questions.some(q => {
      if (q.askedBy && currentUser?.customerId) {
        return q.askedBy === currentUser.firstName;
      }
      const fullName = `${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''}`.trim();
      return q.askedBy === currentUser?.email || q.askedBy === fullName;
    });
  }

  get displayPrice(): number {
    return this.selectedVariant?.price ?? this.product?.basePrice ?? 0;
  }

  get inStock(): boolean {
    return this.currentStock > 0;
  }

  get isLowStock(): boolean {
    return isLowStock(this.currentStock, this.product?.lowStockThreshold ?? 10);
  }

  handlePrimaryAction() {
    if (!this.inStock) {
      if (!this.authService.isLoggedIn) {
        this.notifyMeClicked = false;
        this.notifyMeMessage = '';
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
        return;
      }

      this.notifyMeClicked = true;
      this.notifyMeMessage = 'We will let you know when this is back in stock';
      this.callNotifyMeApi();
      return;
    }

    this.notifyMeClicked = false;
    this.notifyMeMessage = '';
    this.addToCart();
  }
  
  private callNotifyMeApi() {
    if (!this.product || !this.authService.currentUser?.email) return;

    const sku = this.selectedVariant?.sku ?? this.product.code;
    const email = this.authService.currentUser.email;

    this.stockNotificationService.registerNotifyMe(sku, email).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  get isWishlisted(): boolean {
    if (!this.product) {
      return false;
    }
    return this.wishlistService.isWishlisted(this.product.id, this.selectedVariant?.id);
  }

  toggleWishlist(): void {
    if (!this.product) return;

    if (!this.authService.isLoggedIn) {
      const shouldNavigate = window.confirm('Please log in to use your wishlist. Go to login now?');
      if (shouldNavigate) {
        this.router.navigate(['/login']);
      }
      return;
    }

    this.togglingWishlist = true;
    this.wishlistService.toggleEntry({
      productId: this.product.id,
      variantId: this.selectedVariant?.id
    }).subscribe({
      next: () => {
        this.togglingWishlist = false;
        this.wishlistMessage = this.isWishlisted ? 'Added to wishlist.' : 'Removed from wishlist.';
        setTimeout(() => this.wishlistMessage = '', 2500);
      },
      error: () => {
        this.togglingWishlist = false;
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
    this.addToCartError = '';
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
      error: (err) => {
        this.addingToCart = false;
        this.addToCartError = err?.error?.message || 'Unable to add this item to your cart right now. Please try again in sometime.';
      }
    });
  }

  submitQuestion(): void {
    if (!this.product || !this.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    const trimmed = this.questionText.trim();
    if (!trimmed) {
      this.questionError = 'Please type your question before submitting.';
      return;
    }

    if (trimmed.length > 200) {
      this.questionError = 'Questions may not exceed 200 characters.';
      return;
    }

    if (this.hasAskedQuestion) {
      this.questionError = "You've already asked a question about this product.";
      return;
    }

    this.submittingQuestion = true;
    this.questionError = '';
    this.questionSuccessMessage = '';

    this.productQuestionService.submitQuestion(this.product.id, { question: trimmed }).subscribe({
      next: (question) => {
        this.questions = [question, ...this.questions];
        this.questionText = '';
        this.questionSuccessMessage = 'Your question has been published.';
        this.submittingQuestion = false;
      },
      error: (err) => {
        this.submittingQuestion = false;
        this.questionError = err?.error?.message || 'Unable to post your question right now. Please try again.';
      }
    });
  }

  submitAnswer(question: ProductQuestion): void {
    if (!this.product || !this.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    if (question.answer) {
      this.answerErrorByQuestionId[question.id] = 'This question has already been answered.';
      return;
    }

    const answerText = (this.answerTextByQuestionId[question.id] ?? '').trim();
    if (!answerText) {
      this.answerErrorByQuestionId[question.id] = 'Please type your answer before submitting.';
      return;
    }

    if (answerText.length > 500) {
      this.answerErrorByQuestionId[question.id] = 'Answers may not exceed 500 characters.';
      return;
    }

    this.answerLoadingByQuestionId[question.id] = true;
    this.answerErrorByQuestionId[question.id] = '';
    this.answerSuccessByQuestionId[question.id] = '';

    this.productQuestionService.submitAnswer(
      // this.product.id, 
      question.id, { answer: answerText }).subscribe({
      next: (updatedQuestion) => {
        const index = this.questions.findIndex(q => q.id === question.id);
        if (index !== -1) {
          this.questions[index] = updatedQuestion;
        }
        this.answerTextByQuestionId[question.id] = '';
        this.answerSuccessByQuestionId[question.id] = 'Answer published.';
        this.answerLoadingByQuestionId[question.id] = false;
      },
      error: (err) => {
        this.answerLoadingByQuestionId[question.id] = false;
        this.answerErrorByQuestionId[question.id] = err?.error?.message || 'Unable to submit the answer. Please try again.';
      }
    });
  }

  getAnswerLabel(role?: string): string {
    const normalized = role?.toLowerCase() ?? '';
    return normalized === 'admin' || normalized === 'staff' ? 'Team' : 'Customer';
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

  private loadQuestions(productId: number): void {
    this.questionsLoading = true;
    this.productQuestionService.getProductQuestions(productId).subscribe({
      next: (questions) => {
        this.questions = questions.sort((a, b) => new Date(b.askedAt).getTime() - new Date(a.askedAt).getTime());
        this.questionsLoading = false;
      },
      error: () => {
        this.questions = [];
        this.questionsLoading = false;
      }
    });
  }
}
