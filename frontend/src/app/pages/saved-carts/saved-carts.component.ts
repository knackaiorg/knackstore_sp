import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SavedCartSummary } from '../../models';
import { SavedCartService } from '../../core/services/saved-cart.service';

@Component({
  selector: 'app-saved-carts',
  templateUrl: './saved-carts.component.html'
})
export class SavedCartsComponent implements OnInit {
  loading = true;
  deletingId: number | null = null;
  savedCarts: SavedCartSummary[] = [];
  error = '';

  constructor(
    private savedCartService: SavedCartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSavedCarts();
  }

  loadSavedCarts(): void {
    this.loading = true;
    this.error = '';
    this.savedCartService.getSavedCarts().subscribe({
      next: carts => {
        this.savedCarts = carts;
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.message || 'Unable to load saved carts. Please try again.';
        this.loading = false;
      }
    });
  }

  openSavedCart(savedCartId: number): void {
    this.router.navigate(['/account/saved-carts', savedCartId]);
  }

  deleteSavedCart(cart: SavedCartSummary, event?: Event): void {
    event?.stopPropagation();
    if (!window.confirm(`Delete saved cart ${cart.cartName}?`)) {
      return;
    }

    this.deletingId = cart.id;
    this.savedCartService.deleteSavedCart(cart.id).subscribe({
      next: () => {
        this.savedCarts = this.savedCarts.filter(c => c.id !== cart.id);
        this.deletingId = null;
      },
      error: () => {
        this.deletingId = null;
      }
    });
  }
}
