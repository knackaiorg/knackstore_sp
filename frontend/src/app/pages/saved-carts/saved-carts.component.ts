import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SavedCart } from '../../models';
import { SavedCartService } from '../../core/services/saved-cart.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-saved-carts',
  templateUrl: './saved-carts.component.html'
})
export class SavedCartsComponent implements OnInit {
  savedCarts: SavedCart[] = [];
  selectedCart: SavedCart | null = null;
  loading = true;
  message = '';

  constructor(
    private savedCartService: SavedCartService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadSavedCart(+id);
      } else {
        this.loadList();
      }
    });
  }

  loadList() {
    this.loading = true;
    this.savedCartService.list().subscribe({
      next: carts => {
        this.savedCarts = carts;
        this.selectedCart = null;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadSavedCart(id: number) {
    this.loading = true;
    this.savedCartService.get(id).subscribe({
      next: cart => {
        this.selectedCart = cart;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  deleteSavedCart(id: number) {
    if (!window.confirm('Delete this saved cart?')) return;
    this.savedCartService.delete(id).subscribe(() => this.loadList());
  }

  removeEntry(savedCartId: number, entryId: number) {
    this.savedCartService.removeEntry(savedCartId, entryId).subscribe({
      next: cart => this.selectedCart = cart,
      error: () => this.message = 'Unable to remove that item right now.'
    });
  }

  addToCart(savedCartId: number) {
    this.savedCartService.addToCart(savedCartId).subscribe({
      next: cart => {
        this.message = cart.message || 'Added available items to your cart.';
        this.selectedCart = cart;
      },
      error: () => this.message = 'We could not add this saved cart to your active cart.'
    });
  }

  openSavedCart(cart: SavedCart) {
    this.router.navigate(['/account/saved-carts', cart.id]);
  }
}
