import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Cart } from '../../models';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';

@Component({ selector: 'app-cart', templateUrl: './cart.component.html' })
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  loading = true;

  constructor(private cartService: CartService, private authService: AuthService, private router: Router) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn) { this.router.navigate(['/login']); return; }
    this.cartService.loadCart().subscribe(c => { this.cart = c; this.loading = false; });
  }

  updateQty(entryId: number, qty: number) {
    this.cartService.updateEntry(entryId, qty).subscribe(c => this.cart = c);
  }

  removeEntry(entryId: number) {
    this.cartService.removeEntry(entryId).subscribe(c => this.cart = c);
  }

  checkout() { this.router.navigate(['/checkout']); }
}
