import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { Cart, SavedCartSummary } from '../../models';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { SavedCartService } from '../../core/services/saved-cart.service';

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
  savingCart = false;
  showSaveCartModal = false;
  loadingSavedCartOptions = false;
  saveCartName = '';
  selectedSavedCartId: number | null = null;
  savedCartOptions: SavedCartSummary[] = [];
  saveSuccess = '';
  saveError = '';
  updateError = '';
  private pollSub?: Subscription;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private savedCartService: SavedCartService
  ) {}

  ngOnInit() {
    // Ensure user is logged in
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadCart();
    this.loadSavedCartOptions();
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
    const entry = this.cart?.entries.find(e => e.entryId === entryId);
    if (entry && !entry.validForCheckout) return;

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

  loadSavedCartOptions() {
    this.loadingSavedCartOptions = true;
    this.savedCartService.getSavedCarts().subscribe({
      next: carts => {
        this.savedCartOptions = carts;
        this.loadingSavedCartOptions = false;
      },
      error: () => {
        this.loadingSavedCartOptions = false;
      }
    });
  }

  onSelectedSavedCartChange() {
    if (!this.selectedSavedCartId) {
      this.saveCartName = '';
      return;
    }
    const selected = this.savedCartOptions.find(c => c.id === this.selectedSavedCartId);
    this.saveCartName = selected?.cartName || '';
  }

  saveCart() {
    const name = this.saveCartName.trim();
    if (!this.cart || this.cart.entries.length === 0 || this.savingCart || !name) {
      return;
    }

    this.savingCart = true;
    this.saveSuccess = '';
    this.saveError = '';

    this.savedCartService.saveCurrentCart({
      cartName: name,
      targetSavedCartId: this.selectedSavedCartId || undefined
    }).subscribe({
      next: saved => {
        this.savingCart = false;
        this.saveSuccess = this.selectedSavedCartId
          ? `Updated ${saved.cartName}. Your active cart is unchanged.`
          : `Saved as ${saved.cartName}. Your active cart is unchanged.`;
        this.showSaveCartModal = false;
        this.selectedSavedCartId = null;
        this.saveCartName = '';
        this.loadSavedCartOptions();
      },
      error: err => {
        this.savingCart = false;
        this.saveError = err?.error?.message || 'Unable to save this cart right now. Please try again.';
      }
    });
  }

  get canSaveCart(): boolean {
    return !!this.cart && this.cart.entries.length > 0 && !!this.saveCartName.trim() && !this.savingCart;
  }

  openSaveCartModal() {
    if (!this.cart || this.cart.entries.length === 0) {
      return;
    }
    this.saveError = '';
    this.showSaveCartModal = true;
    this.loadSavedCartOptions();
  }

  closeSaveCartModal() {
    if (this.savingCart) {
      return;
    }
    this.showSaveCartModal = false;
    this.selectedSavedCartId = null;
    this.saveCartName = '';
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
