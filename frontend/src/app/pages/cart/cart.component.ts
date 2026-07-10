import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { Cart } from '../../models';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';

/**
 * CartComponent
 * Displays shopping cart with items and order summary
 * Integrates promo code component for discount application
 */
@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html'
})
export class CartComponent implements OnInit, OnDestroy {
  cart: Cart | null = null;
  loading = true;
  updateError = '';
  private pollSub?: Subscription;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Ensure user is logged in
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadCart();
    // Reservation holds expire server-side in the background; poll so an expiry is reflected
    // (and the checkout-blocking banner appears) without requiring a manual page refresh.
    this.pollSub = interval(5000).subscribe(() => this.loadCart(true));
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  /**
   * Load cart data from backend
   */
  loadCart(silent = false) {
    if (!silent) this.loading = true;
    this.cartService.loadCart().subscribe({
      next: (c) => {
        this.cart = c;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Update item quantity
   */
  updateQty(entryId: number, qty: number) {
    this.updateError = '';
    this.cartService.updateEntry(entryId, qty).subscribe({
      next: (c) => this.cart = c,
      error: (err) => {
        this.updateError = err?.error?.message || 'Unable to update quantity right now. Please try again.';
        this.loadCart();
      }
    });
  }

  /**
   * Remove item from cart
   */
  removeEntry(entryId: number) {
    this.cartService.removeEntry(entryId).subscribe(c => this.cart = c);
  }

  /**
   * Handle promo code change event
   * Reload cart to get updated discount information
   */
  onPromoCodeChanged() {
    this.loadCart();
  }

  /**
   * Navigate to checkout
   */
  checkout() {
    this.router.navigate(['/checkout']);
  }

  get hasInvalidEntries(): boolean {
    return !!this.cart?.entries.some(e => !e.validForCheckout);
  }
}
