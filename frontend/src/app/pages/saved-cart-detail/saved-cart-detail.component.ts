import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SavedCartDetail } from '../../models';
import { CartService } from '../../core/services/cart.service';
import { SavedCartService } from '../../core/services/saved-cart.service';

@Component({
  selector: 'app-saved-cart-detail',
  templateUrl: './saved-cart-detail.component.html'
})
export class SavedCartDetailComponent implements OnInit {
  loading = true;
  processing = false;
  removingEntryId: number | null = null;
  savedCart: SavedCartDetail | null = null;
  error = '';
  infoMessage = '';
  unavailableItems: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private savedCartService: SavedCartService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const savedCartId = Number(params['savedCartId']);
      if (!savedCartId) {
        this.router.navigate(['/account/saved-carts']);
        return;
      }
      this.loadSavedCart(savedCartId);
    });
  }

  loadSavedCart(savedCartId: number): void {
    this.loading = true;
    this.error = '';
    this.savedCartService.getSavedCart(savedCartId).subscribe({
      next: cart => {
        this.savedCart = cart;
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.message || 'Unable to load saved cart details.';
        this.loading = false;
      }
    });
  }

  deleteSavedCart(): void {
    if (!this.savedCart) {
      return;
    }
    if (!window.confirm(`Delete saved cart ${this.savedCart.cartName}?`)) {
      return;
    }

    this.processing = true;
    this.savedCartService.deleteSavedCart(this.savedCart.id).subscribe({
      next: () => {
        this.router.navigate(['/account/saved-carts']);
      },
      error: () => {
        this.processing = false;
      }
    });
  }

  removeEntry(entryId: number): void {
    if (!this.savedCart) {
      return;
    }

    this.removingEntryId = entryId;
    this.savedCartService.removeEntry(this.savedCart.id, entryId).subscribe({
      next: cart => {
        this.savedCart = cart;
        this.removingEntryId = null;
      },
      error: () => {
        this.removingEntryId = null;
      }
    });
  }

  addAllToCart(): void {
    if (!this.savedCart) {
      return;
    }

    this.processing = true;
    this.infoMessage = '';
    this.unavailableItems = [];

    this.savedCartService.addAllToActiveCart(this.savedCart.id).subscribe({
      next: response => {
        this.cartService.loadCart().subscribe();
        this.infoMessage = response.message;
        this.unavailableItems = response.unavailableItems || [];
        this.processing = false;
      },
      error: err => {
        this.infoMessage = err?.error?.message || 'Unable to add saved cart items right now.';
        this.processing = false;
      }
    });
  }

  goToProduct(productId: number): void {
    this.router.navigate(['/products', productId]);
  }
}
