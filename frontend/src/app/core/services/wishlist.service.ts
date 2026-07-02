import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Wishlist, ToggleWishlistEntryRequest } from '../../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private apiUrl = environment.apiUrl;
  private wishlistSubject = new BehaviorSubject<Wishlist | null>(null);
  wishlist$ = this.wishlistSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadWishlist(): Observable<Wishlist> {
    return this.http.get<Wishlist>(`${this.apiUrl}/wishlist`).pipe(tap(w => this.wishlistSubject.next(w)));
  }

  toggleEntry(request: ToggleWishlistEntryRequest): Observable<Wishlist> {
    return this.http.post<Wishlist>(`${this.apiUrl}/wishlist/toggle`, request).pipe(tap(w => this.wishlistSubject.next(w)));
  }

  removeEntry(entryId: number): Observable<Wishlist> {
    return this.http.delete<Wishlist>(`${this.apiUrl}/wishlist/entries/${entryId}`).pipe(tap(w => this.wishlistSubject.next(w)));
  }

  moveToCart(entryId: number): Observable<Wishlist> {
    return this.http.post<Wishlist>(`${this.apiUrl}/wishlist/entries/${entryId}/move-to-cart`, {}).pipe(tap(w => this.wishlistSubject.next(w)));
  }

  clearLocal(): void {
    this.wishlistSubject.next(null);
  }

  get itemCount(): number {
    return this.wishlistSubject.value?.totalItems ?? 0;
  }

  isWishlisted(productId: number, variantId?: number, matchAnyVariant = false): boolean {
    const entries = this.wishlistSubject.value?.entries ?? [];
    if (matchAnyVariant) {
      return entries.some(entry => entry.productId === productId);
    }

    return entries.some(entry =>
      entry.productId === productId &&
      ((variantId ?? null) === (entry.variantId ?? null))
    );
  }
}
