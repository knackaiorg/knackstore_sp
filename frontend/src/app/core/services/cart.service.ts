import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, concatMap, from, last, Observable, tap } from 'rxjs';
import { Cart, AddEntryRequest } from '../../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CartService {
  private apiUrl = environment.apiUrl;
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadCart(): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}/cart`).pipe(tap(c => this.cartSubject.next(c)));
  }

  addEntry(request: AddEntryRequest): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/cart/entries`, request).pipe(tap(c => this.cartSubject.next(c)));
  }

  updateEntry(entryId: number, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`${this.apiUrl}/cart/entries/${entryId}`, { quantity }).pipe(tap(c => this.cartSubject.next(c)));
  }
  // Add multiple entries sequentially (e.g. for reorder), emits the final cart state
  addEntries(requests: AddEntryRequest[]): Observable<Cart> {
    return from(requests).pipe(
      concatMap(request => this.addEntry(request)),
      last() // emit only the final cart after all entries are added
    );
  }
  reorder(orderCode: string): Observable<Cart> {
  return this.http.post<Cart>(`${this.apiUrl}/orders/${orderCode}/reorder`, {})
    .pipe(tap(c => this.cartSubject.next(c)));
}
  removeEntry(entryId: number): Observable<Cart> {
    return this.http.delete<Cart>(`${this.apiUrl}/cart/entries/${entryId}`).pipe(tap(c => this.cartSubject.next(c)));
  }

  clearLocal(): void { this.cartSubject.next(null); }

  get itemCount(): number { return this.cartSubject.value?.totalItems ?? 0; }
}
