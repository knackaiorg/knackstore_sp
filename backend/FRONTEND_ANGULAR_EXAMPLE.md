// ============================================================================
// FRONTEND ANGULAR IMPLEMENTATION EXAMPLE
// Recently Viewed Products Feature
// ============================================================================

// FILE 1: product-view.service.ts
// ============================================================================
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

export interface LogProductViewRequest {
  guestSessionId: string;
  productId: number;
}

export interface LogProductViewResponse {
  productViewId: number;
  productId: number;
  viewedAt: string;
  message: string;
}

export interface RecentlyViewedResponse {
  guestSessionId: string;
  totalViewCount: number;
  returnedCount: number;
  products: RecentProductItem[];
}

export interface RecentProductItem {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  productImage: string;
  productPrice: number;
  viewedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductViewService {
  private readonly GUEST_SESSION_KEY = 'guest_session_id';
  private readonly API_URL = '/api/product-views';
  private guestSessionId: string;

  constructor(private http: HttpClient) {
    this.guestSessionId = this.getOrCreateSessionId();
  }

  /**
   * Get or create a unique guest session ID
   * Persists in localStorage to survive page refreshes
   */
  private getOrCreateSessionId(): string {
    let sessionId = this.getSessionIdFromStorage();
    
    if (!sessionId) {
      sessionId = uuidv4();
      this.saveSessionIdToStorage(sessionId);
    }
    
    return sessionId;
  }

  private getSessionIdFromStorage(): string | null {
    return localStorage.getItem(this.GUEST_SESSION_KEY);
  }

  private saveSessionIdToStorage(sessionId: string): void {
    localStorage.setItem(this.GUEST_SESSION_KEY, sessionId);
  }

  /**
   * Get the current guest session ID
   */
  getSessionId(): string {
    return this.guestSessionId;
  }

  /**
   * Start a new session (clears previous session ID)
   */
  startNewSession(): void {
    this.guestSessionId = uuidv4();
    this.saveSessionIdToStorage(this.guestSessionId);
  }

  /**
   * Log a product view
   * Call this when user navigates to a product detail page
   */
  logProductView(productId: number): Observable<LogProductViewResponse> {
    const request: LogProductViewRequest = {
      guestSessionId: this.guestSessionId,
      productId: productId
    };
    
    return this.http.post<LogProductViewResponse>(
      `${this.API_URL}/log`,
      request
    );
  }

  /**
   * Get recently viewed products (lightweight version)
   * Best for displaying in the recently viewed strip
   */
  getRecentlyViewed(): Observable<RecentlyViewedResponse> {
    const params = new HttpParams()
      .set('guestSessionId', this.guestSessionId);
    
    return this.http.get<RecentlyViewedResponse>(
      `${this.API_URL}/recently-viewed`,
      { params }
    );
  }

  /**
   * Get recently viewed products with full details
   * Use when you need complete product information
   */
  getRecentlyViewedWithDetails(): Observable<any[]> {
    const params = new HttpParams()
      .set('guestSessionId', this.guestSessionId);
    
    return this.http.get<any[]>(
      `${this.API_URL}/recently-viewed/detailed`,
      { params }
    );
  }

  /**
   * Clear all recently viewed products for current session
   */
  clearRecentlyViewed(): Observable<void> {
    const params = new HttpParams()
      .set('guestSessionId', this.guestSessionId);
    
    return this.http.delete<void>(
      `${this.API_URL}/clear`,
      { params }
    );
  }
}


// FILE 2: product-detail.component.ts
// ============================================================================
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from './product.service';
import { ProductViewService } from './product-view.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  productId: number;
  product: any;
  loading: boolean = true;
  error: string = null;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private productViewService: ProductViewService
  ) {}

  ngOnInit(): void {
    // Get product ID from URL
    this.route.params.subscribe(params => {
      this.productId = +params['id'];
      this.loadProduct();
      this.logView();
    });
  }

  private loadProduct(): void {
    this.loading = true;
    this.productService.getProduct(this.productId).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load product';
        this.loading = false;
        console.error('Product loading error:', err);
      }
    });
  }

  /**
   * Log the view silently (fire and forget)
   * No need to wait for response or show to user
   */
  private logView(): void {
    this.productViewService.logProductView(this.productId).subscribe({
      next: () => {
        // View logged successfully
      },
      error: (err) => {
        // Silently fail - don't interrupt user experience
        console.warn('Failed to log product view:', err);
      }
    });
  }
}


// FILE 3: recently-viewed.component.ts
// ============================================================================
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ProductViewService, RecentlyViewedResponse, RecentProductItem } from './product-view.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-recently-viewed',
  templateUrl: './recently-viewed.component.html',
  styleUrls: ['./recently-viewed.component.css']
})
export class RecentlyViewedComponent implements OnInit, OnDestroy {
  products: RecentProductItem[] = [];
  loading: boolean = false;
  error: string = null;
  private destroy$ = new Subject<void>();

  constructor(
    private productViewService: ProductViewService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRecentlyViewed();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load recently viewed products
   */
  loadRecentlyViewed(): void {
    this.loading = true;
    this.error = null;

    this.productViewService.getRecentlyViewed()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: RecentlyViewedResponse) => {
          this.products = response.products;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load recently viewed products';
          this.loading = false;
          console.error('Error loading recently viewed:', err);
        }
      });
  }

  /**
   * Navigate to product detail page
   */
  viewProduct(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  /**
   * Clear all recently viewed products
   */
  clearHistory(): void {
    if (!confirm('Are you sure you want to clear your viewing history?')) {
      return;
    }

    this.loading = true;
    this.productViewService.clearRecentlyViewed()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.products = [];
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to clear history';
          this.loading = false;
          console.error('Error clearing history:', err);
        }
      });
  }

  /**
   * Show/hide the component based on whether there are products
   */
  get hasProducts(): boolean {
    return this.products && this.products.length > 0;
  }
}


// FILE 4: recently-viewed.component.html
// ============================================================================
/*
<div class="recently-viewed-container" *ngIf="hasProducts || loading">
  <!-- Header -->
  <div class="recently-viewed-header">
    <h3>Recently Viewed Products</h3>
    <button 
      *ngIf="hasProducts"
      class="clear-btn" 
      (click)="clearHistory()"
      [disabled]="loading">
      Clear History
    </button>
  </div>

  <!-- Loading Spinner -->
  <div *ngIf="loading" class="loading-spinner">
    <p>Loading...</p>
  </div>

  <!-- Error Message -->
  <div *ngIf="error && !loading" class="error-message">
    {{ error }}
    <button (click)="loadRecentlyViewed()">Retry</button>
  </div>

  <!-- Products Horizontal Strip -->
  <div *ngIf="hasProducts && !loading" class="products-strip">
    <div class="scroll-container">
      <div 
        class="product-card" 
        *ngFor="let item of products"
        (click)="viewProduct(item.productId)">
        
        <!-- Product Image -->
        <div class="product-image">
          <img 
            [src]="item.productImage" 
            [alt]="item.productName"
            loading="lazy">
        </div>

        <!-- Product Info -->
        <div class="product-info">
          <h4 class="product-name">{{ item.productName }}</h4>
          <p class="product-code">{{ item.productCode }}</p>
          <p class="product-price">${{ item.productPrice | currency }}</p>
          <small class="viewed-at">
            Viewed: {{ item.viewedAt | date: 'short' }}
          </small>
        </div>

        <!-- Hover Overlay -->
        <div class="product-overlay">
          <button class="view-btn">View Product</button>
        </div>
      </div>
    </div>
  </div>

  <!-- No Products State -->
  <div *ngIf="!hasProducts && !loading && !error" class="empty-state">
    <p>You haven't viewed any products yet.</p>
  </div>
</div>
*/


// FILE 5: recently-viewed.component.css
// ============================================================================
/*
.recently-viewed-container {
  padding: 20px;
  background: #f9f9f9;
  margin: 20px 0;
  border-radius: 8px;
}

.recently-viewed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.recently-viewed-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.clear-btn {
  background-color: #ff4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
}

.clear-btn:hover:not(:disabled) {
  background-color: #cc0000;
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.products-strip {
  overflow-x: auto;
  overflow-y: hidden;
}

.scroll-container {
  display: flex;
  gap: 20px;
  padding: 10px 0;
  /* Remove default scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: #ddd #f0f0f0;
}

/* Webkit scrollbar styling */
.scroll-container::-webkit-scrollbar {
  height: 8px;
}

.scroll-container::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}

.scroll-container::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 4px;
}

.scroll-container::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.product-card {
  flex-shrink: 0;
  width: 200px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.product-image {
  width: 100%;
  height: 150px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 12px;
}

.product-name {
  margin: 0 0 4px 0;
  font-size: 0.95rem;
  color: #333;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-code {
  margin: 0 0 4px 0;
  font-size: 0.8rem;
  color: #999;
}

.product-price {
  margin: 0 0 4px 0;
  font-size: 1rem;
  color: #0066cc;
  font-weight: 600;
}

.viewed-at {
  display: block;
  font-size: 0.75rem;
  color: #bbb;
  margin-top: 4px;
}

.product-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.product-card:hover .product-overlay {
  opacity: 1;
}

.view-btn {
  background-color: #0066cc;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.view-btn:hover {
  background-color: #0052a3;
}

.loading-spinner {
  padding: 20px;
  text-align: center;
  color: #999;
}

.error-message {
  padding: 15px;
  background-color: #ffe6e6;
  color: #cc0000;
  border-radius: 4px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-message button {
  background-color: #cc0000;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.error-message button:hover {
  background-color: #990000;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}
*/


// FILE 6: app.module.ts (Update)
// ============================================================================
/*
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { ProductDetailComponent } from './product-detail.component';
import { RecentlyViewedComponent } from './recently-viewed.component';

@NgModule({
  declarations: [
    AppComponent,
    ProductDetailComponent,
    RecentlyViewedComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule  // Required for HTTP calls
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
*/

// FILE 7: package.json (Add UUID dependency)
// ============================================================================
/*
{
  "dependencies": {
    "uuid": "^9.0.0"
  }
}

// Install with: npm install uuid
*/


