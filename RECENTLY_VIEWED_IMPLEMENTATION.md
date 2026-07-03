# Recently Viewed Products – Logged-In Customer Tracking Implementation

## Overview

This document describes the implementation of persistent recently viewed product tracking for authenticated customers, while maintaining existing anonymous user behavior.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Angular)                     │
├─────────────────────────────────────────────────────────────┤
│  RecentlyViewedService                                       │
│  ├── Logged-in: POST/GET/DELETE /api/carousel/*              │
│  └── Anonymous: localStorage                                 │
├─────────────────────────────────────────────────────────────┤
│  RecentlyViewedProductsComponent                             │
│  ├── Subscribes to history$, loading$, error$                │
│  └── Renders carousel or loading/error/empty states          │
├─────────────────────────────────────────────────────────────┤
│  ProductDetailComponent                                      │
│  └── Calls recentlyViewedService.addProduct(product)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Spring Boot)                     │
├─────────────────────────────────────────────────────────────┤
│  CustomerCarouselController                                  │
│  ├── POST /api/carousel/track                                │
│  ├── GET  /api/carousel/{customerId}                         │
│  └── DELETE /api/carousel/{customerId}                       │
├─────────────────────────────────────────────────────────────┤
│  CustomerCarouselService → CustomerCarousel (Entity/DB)      │
└─────────────────────────────────────────────────────────────┘
```

---

## Files Modified

### Backend

| File | Change |
|------|--------|
| `backend/src/main/java/com/knack/store/dto/AuthDTO.java` | Added `customerId` field to `AuthResponse` |
| `backend/src/main/java/com/knack/store/service/CustomerService.java` | Pass `customer.getId()` in login/register responses |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/app/models/index.ts` | Added `customerId: number` to `AuthResponse` interface |
| `frontend/src/app/core/services/recently-viewed.service.ts` | Full rewrite with real API integration |
| `frontend/src/app/shared/components/recently-viewed-products/recently-viewed-products.component.ts` | Added loading$, error$ subscriptions |
| `frontend/src/app/shared/components/recently-viewed-products/recently-viewed-products.component.html` | Added error state display |

---

## API Endpoints Used

### 1. Track Product View (POST)

```
POST /api/carousel/track
Content-Type: application/json

{
  "customerId": "2",
  "productId": "3"
}
```

**Response:**
```json
{
  "customerId": "2",
  "productIds": ["3", "1", "5"],
  "updatedAt": "2026-06-19T10:30:00"
}
```

### 2. Retrieve Recently Viewed (GET)

```
GET /api/carousel/{customerId}
```

**Response:**
```json
{
  "customerId": "1",
  "productIds": ["3", "7", "2"],
  "updatedAt": "2026-06-19T10:30:00"
}
```

### 3. Clear History (DELETE)

```
DELETE /api/carousel/{customerId}
```

**Response:** `204 No Content`

---

## Service Implementation Details

### `RecentlyViewedService` (frontend/src/app/core/services/recently-viewed.service.ts)

#### Public API

| Method/Property | Description |
|-----------------|-------------|
| `history$` | Observable stream of recently viewed products |
| `loading$` | Observable boolean for loading state |
| `error$` | Observable string/null for error messages |
| `addProduct(product)` | Track a product visit (routes to server or localStorage) |
| `loadHistory()` | Reload history from active storage source |
| `clearHistory()` | Returns `Observable<boolean>` — `true` on success, `false` on failure |

#### Flow: Logged-In User

1. **Track**: `addProduct()` → POST `/api/carousel/track` with `{customerId, productId}`
2. **Duplicate Prevention**: Uses `trackingInProgress` Set to prevent duplicate API calls during same render
3. **Fetch**: After tracking, calls `loadHistory()` → GET `/api/carousel/{id}` → resolves each productId to full `Product` via `ProductService.getProductById()`
4. **Delete**: `clearHistory()` → DELETE `/api/carousel/{id}` → emits empty array

#### Flow: Anonymous User (Unchanged)

1. **Track**: Stores product JSON in `localStorage` under key `recently_viewed_products`
2. **Fetch**: Reads from `localStorage`
3. **Delete**: Removes `localStorage` key

---

## Component: RecentlyViewedProductsComponent

### States Handled

| State | Behavior |
|-------|----------|
| **Loading** | Shows spinner |
| **Error** | Shows error message text |
| **Empty** | Hides section entirely (no carousel rendered) |
| **Data** | Renders product carousel |

### Inputs

- `excludeProductId` — Optionally exclude the current product from the carousel (used on PDP)

---

## Customer ID Propagation

The `customerId` is now included in the `AuthResponse` from login/register:

```typescript
// Frontend model
export interface AuthResponse {
  customerId: number;
  token: string;
  email: string;
  firstName: string;
  lastName: string;
}
```

The `RecentlyViewedService` retrieves it via:
```typescript
private get customerId(): string {
  return String(this.authService.currentUser?.customerId ?? '');
}
```

---

## Data Flow Diagrams

### Logged-In Customer Visits PDP

```
ProductDetailComponent.ngOnInit()
        │
        ▼
recentlyViewedService.addProduct(product)
        │
        ▼ (authService.isLoggedIn === true)
POST /api/carousel/track { customerId, productId }
        │
        ▼ (on success)
recentlyViewedService.loadHistory()
        │
        ▼
GET /api/carousel/{customerId}
        │
        ▼ (returns productIds[])
forkJoin: productService.getProductById(id) for each ID
        │
        ▼
historySubject.next(products)
        │
        ▼
RecentlyViewedProductsComponent receives updated list
        │
        ▼
Renders <app-product-carousel>
```

### Anonymous Customer Visits PDP

```
ProductDetailComponent.ngOnInit()
        │
        ▼
recentlyViewedService.addProduct(product)
        │
        ▼ (authService.isLoggedIn === false)
localStorage: prepend product, cap at 10
        │
        ▼
historySubject.next(localHistory)
        │
        ▼
RecentlyViewedProductsComponent receives updated list
```

---

## Future Integration: Clear History from My Account

The `clearHistory()` method is designed for easy UI integration:

```typescript
// In a future MyAccount component:
clearRecentlyViewed(): void {
  this.recentlyViewedService.clearHistory().subscribe(success => {
    if (success) {
      this.successMessage = 'Recently viewed history cleared.';
    } else {
      this.errorMessage = 'Failed to clear history. Please try again.';
    }
  });
}
```

---

## Testing Checklist

- [ ] Log in → visit a PDP → verify POST /api/carousel/track is called with correct customerId and productId
- [ ] Visit home page → verify GET /api/carousel/{id} is called and carousel renders
- [ ] Log out → visit PDP → verify localStorage is used (no API calls)
- [ ] Anonymous user → verify carousel shows localStorage products
- [ ] Duplicate product visits don't trigger multiple simultaneous POST calls
- [ ] Error from API → verify error message appears, no crash
- [ ] Empty carousel response → verify section is hidden
- [ ] clearHistory() → verify DELETE is called and carousel clears
