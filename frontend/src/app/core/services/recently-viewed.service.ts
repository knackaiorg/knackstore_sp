import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
import { map, tap, catchError, switchMap, skip } from 'rxjs/operators';
import { Product } from '../../models';
import { AuthService } from './auth.service';
import { ProductService } from './product.service';
import { environment } from '../../../environments/environment';

interface CarouselResponse {
  customerId: string;
  productIds: string[];
  updatedAt: string;
}

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 10;

@Injectable({ providedIn: 'root' })
export class RecentlyViewedService {
  private apiUrl = environment.apiUrl;
  private historySubject = new BehaviorSubject<Product[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private trackingInProgress = new Set<number>();

  history$ = this.historySubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private productService: ProductService
  ) {
    this.loadHistory();

    // Re-load history when auth state changes (login/logout)
    // skip(1) avoids duplicate call since loadHistory() was already called above
    // this.authService.currentUser$.pipe(skip(1)).subscribe(() => {
    //   this.loadHistory();
    // });
  }

  addProduct(product: Product): void {
    if (this.authService.isLoggedIn) {
      this.addToServerHistory(product);
    } else {
      this.addToLocalHistory(product);
    }
  }

  loadHistory(): void {
    if (this.authService.isLoggedIn) {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);
      this.fetchServerHistory().subscribe({
        next: (products: Product[]) => {
          this.historySubject.next(products);
          this.loadingSubject.next(false);
        },
        error: () => {
          this.errorSubject.next('Failed to load recently viewed products.');
          this.loadingSubject.next(false);
        }
      });
    } else {
      this.historySubject.next(this.getLocalHistory());
    }
  }

  clearHistory(): Observable<boolean> {
    if (this.authService.isLoggedIn) {
      return this.clearServerHistory().pipe(
        tap(() => this.historySubject.next([])),
        map(() => true),
        catchError(() => of(false))
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
      this.historySubject.next([]);
      return of(true);
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
    history = history.filter((p: Product) => p.id !== product.id);
    history.unshift(product);
    if (history.length > MAX_ITEMS) {
      history = history.slice(0, MAX_ITEMS);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    this.historySubject.next(history);
  }

  // ──────────────────────────────────────────────
  // Logged-in user (server API) methods
  // ──────────────────────────────────────────────

  private get customerId(): string {
    return String(this.authService.currentUser?.customerId ?? '');
  }

  private fetchServerHistory(): Observable<Product[]> {
    const id = this.customerId;
    if (!id) return of([]);

    return this.http.get<CarouselResponse>(`${this.apiUrl}/carousel/${id}`).pipe(
      switchMap((response: CarouselResponse) => {
        const productIds = (response.productIds || []).map((pid: string) => Number(pid));
        if (!productIds.length) return of([]);

        const requests = productIds.map((pid: number) =>
          this.productService.getProductById(pid).pipe(catchError(() => of(null)))
        );
        return forkJoin(requests).pipe(
          map((products) => products.filter((p): p is Product => p !== null))
        );
      }),
      catchError(() => of([]))
    );
  }

  private addToServerHistory(product: Product): void {
    if (this.trackingInProgress.has(product.id)) return;
    this.trackingInProgress.add(product.id);

    const payload = {
      customerId: this.customerId,
      productId: String(product.id)
    };

    this.http.post<CarouselResponse>(`${this.apiUrl}/carousel/track`, payload).subscribe({
      next: () => {
        this.trackingInProgress.delete(product.id);
        this.loadHistory();
      },
      error: () => {
        this.trackingInProgress.delete(product.id);
      }
    });
  }

  private clearServerHistory(): Observable<void> {
    const id = this.customerId;
    if (!id) return of(undefined);
    return this.http.delete<void>(`${this.apiUrl}/carousel/${id}`);
  }
}
