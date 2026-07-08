import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  loading = true;

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
  }

  /**
   * Load cart data from backend
   */
  loadCart() {
    this.loading = true;
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
    this.cartService.updateEntry(entryId, qty).subscribe(c => this.cart = c);
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
}
