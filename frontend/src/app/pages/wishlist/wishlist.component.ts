import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Wishlist } from '../../models';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';

@Component({ selector: 'app-wishlist', templateUrl: './wishlist.component.html' })
export class WishlistComponent implements OnInit {
  wishlist: Wishlist | null = null;
  loading = true;
  movingEntryId: number | null = null;
  removingEntryId: number | null = null;

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.wishlistService.loadWishlist().subscribe({
      next: wishlist => {
        this.wishlist = wishlist;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  removeEntry(entryId: number): void {
    this.removingEntryId = entryId;
    this.wishlistService.removeEntry(entryId).subscribe({
      next: wishlist => {
        this.wishlist = wishlist;
        this.removingEntryId = null;
      },
      error: () => {
        this.removingEntryId = null;
      }
    });
  }

  moveToCart(entryId: number): void {
    this.movingEntryId = entryId;
    this.wishlistService.moveToCart(entryId).subscribe({
      next: wishlist => {
        this.wishlist = wishlist;
        this.movingEntryId = null;
        this.cartService.loadCart().subscribe();
      },
      error: () => {
        this.movingEntryId = null;
      }
    });
  }

  viewProduct(productId: number): void {
    this.router.navigate(['/products', productId]);
  }
}
