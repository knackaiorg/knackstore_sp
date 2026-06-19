import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { Product } from '../../models';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 10;

@Injectable({ providedIn: 'root' })
export class RecentlyViewedService {
  private apiUrl = environment.apiUrl;
  private historySubject = new BehaviorSubject<Product[]>([]);

  /** Observable stream of recently viewed products (most recent first). */
  history$ = this.historySubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.loadHistory();
  }

  /** Add a product to the recently viewed list. */
  addProduct(product: Product): void {
    if (this.authService.isLoggedIn) {
      this.addToServerHistory(product);
    } else {
      this.addToLocalHistory(product);
    }
  }

  /** Reload the history from the active storage source. */
  loadHistory(): void {
    if (this.authService.isLoggedIn) {
      this.fetchServerHistory().subscribe(products => {
        this.historySubject.next(products);
      });
    } else {
      this.historySubject.next(this.getLocalHistory());
    }
  }

  /** Clear all recently viewed history from the active storage. */
  clearHistory(): void {
    if (this.authService.isLoggedIn) {
      this.clearServerHistory().subscribe(() => {
        this.historySubject.next([]);
      });
    } else {
      localStorage.removeItem(STORAGE_KEY);
      this.historySubject.next([]);
    }
  }

  // ──────────────────────────────────────────────
  // Guest (localStorage) methods
  // ──────────────────────────────────────────────

  private getLocalHistory(): Product[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored) as Product[];
    } catch {
      return [];
    }
  }

  private addToLocalHistory(product: Product): void {
    let history = this.getLocalHistory();
    // Remove duplicate then prepend
    history = history.filter(p => p.id !== product.id);
    history.unshift(product);
    // Cap at max
    if (history.length > MAX_ITEMS) {
      history = history.slice(0, MAX_ITEMS);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    this.historySubject.next(history);
  }

  // ──────────────────────────────────────────────
  // Logged-in user (server API) placeholder methods
  // Replace these with real API calls when the
  // backend endpoints are available.
  // ──────────────────────────────────────────────

  /** Fetch recently viewed products from the server. */
  private fetchServerHistory(): Observable<Product[]> {
    // TODO: Replace with real endpoint, e.g.:
    // return this.http.get<Product[]>(`${this.apiUrl}/users/recently-viewed`);
    return of(this.getLocalHistory());
  }

  /** Persist a viewed product to the server. */
  private addToServerHistory(product: Product): void {
    // TODO: Replace with real endpoint, e.g.:
    // this.http.post(`${this.apiUrl}/users/recently-viewed/${product.id}`, {}).subscribe();
    // For now, fall back to localStorage so the feature works end-to-end.
    this.addToLocalHistory(product);
  }

  /** Clear server-side recently viewed history. */
  private clearServerHistory(): Observable<void> {
    // TODO: Replace with real endpoint, e.g.:
    // return this.http.delete<void>(`${this.apiUrl}/users/recently-viewed`);
    localStorage.removeItem(STORAGE_KEY);
    return of(undefined);
  }
}
