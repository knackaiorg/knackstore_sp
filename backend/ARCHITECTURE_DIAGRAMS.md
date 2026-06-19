# Recently Viewed Products - Architecture & Flow Diagrams

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Angular)                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ProductViewService                                               │  │
│  │ - guestSessionId: UUID                                           │  │
│  │ - logProductView(productId)                                      │  │
│  │ - getRecentlyViewed()                                            │  │
│  │ - clearRecentlyViewed()                                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                 ↓                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Components                                                       │  │
│  │ - ProductDetailComponent (logs view)                             │  │
│  │ - RecentlyViewedComponent (displays strip)                       │  │
│  │ - Homepage, PDP                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                      HTTP REST ↑ ↓ JSON
                              /  \
                             /    \
┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Spring Boot)                             │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ ProductViewController (REST Endpoints)                         │    │
│  │ POST   /api/product-views/log                                  │    │
│  │ GET    /api/product-views/recently-viewed                      │    │
│  │ GET    /api/product-views/recently-viewed/detailed             │    │
│  │ DELETE /api/product-views/clear                                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                              ↓                                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ ProductViewService (Business Logic)                            │    │
│  │ - logProductView()     [Deduplication + Cleanup]               │    │
│  │ - getRecentlyViewed()  [Return 10 most recent]                 │    │
│  │ - clearRecentlyViewed()                                        │    │
│  │ - cleanupOldViews()    [Auto-delete beyond 10]                 │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                              ↓                                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ ProductViewRepository (JPA)                                    │    │
│  │ - findByGuestSessionIdOrderByViewedAtDesc()                    │    │
│  │ - findByGuestSessionIdAndProductId()                           │    │
│  │ - deleteByGuestSessionId()                                     │    │
│  │ - countByGuestSessionId()                                      │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                              ↓                                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ JPA Entity Layer                                               │    │
│  │ ProductView                                                    │    │
│  │ - id                                                           │    │
│  │ - guestSessionId                                               │    │
│  │ - product (FK → Product)                                       │    │
│  │ - viewedAt                                                     │    │
│  │ - viewCount                                                    │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                              ↓                                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ H2 Database                                                    │    │
│  │ Table: product_views                                           │    │
│  │ Index: (guest_session_id, viewed_at DESC)                      │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Request/Response Flow: Log Product View

```
Frontend                          Backend
   │                                │
   │ 1. User visits Product Detail  │
   │    Page (PDP)                  │
   │    productId = 1               │
   │                                │
   │ 2. POST /api/product-views/log │
   │    {                           │
   │      guestSessionId: "uuid",  │
   │      productId: 1              │
   │    }                           │
   ├─────────────────────────────→ ProductViewController
   │                                │
   │                                │ 3. logProductView()
   │                                ├──→ ProductViewService
   │                                │
   │                                │ 4. Check if product exists
   │                                │    in ProductRepository
   │                                │
   │                                │ 5. Check if already viewed
   │                                │    (findBySessionAndProduct)
   │                                │
   │                                •─ IF exists:
   │                                │   - Update viewedAt
   │                                │   - Increment viewCount
   │                                •
   │                                •─ IF not exists:
   │                                │   - Create new ProductView
   │                                │   - Set viewedAt = NOW
   │                                •
   │                                │ 6. Save to DB
   │                                │    ProductViewRepository.save()
   │                                │
   │                                │ 7. Cleanup old views
   │                                │    if count > 10
   │                                │
   │    201 Created                 │
   │    {                           │
   │      productViewId: 5,        │
   │      productId: 1,             │
   │      viewedAt: "2026-...",    │
   │      message: "..."            │
   │    }                           │
   │←───────────────────────────────┤
   │                                │
```

---

## Request/Response Flow: Get Recently Viewed

```
Frontend                          Backend
   │                                │
   │ 1. On Homepage or PDP          │
   │    Display recently viewed     │
   │    products strip              │
   │                                │
   │ 2. GET /api/product-views/     │
   │    recently-viewed?            │
   │    guestSessionId=uuid         │
   │                                │
   ├─────────────────────────────→ ProductViewController
   │                                │
   │                                │ 3. getRecentlyViewed()
   │                                ├──→ ProductViewService
   │                                │
   │                                │ 4. Query DB with pagination
   │                                │    (max 10 items)
   │                                │    .OrderByViewedAtDesc
   │                                │
   │                                │ 5. Build response DTO
   │                                │    - Map ProductView entities
   │                                │    - Extract product info
   │                                │    - Format timestamps
   │                                │
   │    200 OK                      │
   │    {                           │
   │      guestSessionId: uuid,    │
   │      totalViewCount: 15,      │
   │      returnedCount: 10,       │
   │      products: [              │
   │        {                      │
   │          id: 5,              │
   │          productId: 1,       │
   │          productCode: "...", │
   │          productName: "...", │
   │          productImage: "...",│
   │          productPrice: 2499, │
   │          viewedAt: "..."     │
   │        },                    │
   │        ...                   │
   │      ]                       │
   │    }                           │
   │←───────────────────────────────┤
   │                                │
   │ 6. Render products in          │
   │    horizontal strip            │
   │                                │
```

---

## Deduplication & Re-ordering Logic

```
Scenario: User views Product A, then B, then A again

STEP 1: Log view Product A
   ProductView Table:
   ┌─────┬──────────┬────────┬─────────────────┐
   │ id  │ product  │ count  │ viewedAt        │
   ├─────┼──────────┼────────┼─────────────────┤
   │ 1   │ A        │ 1      │ 14:00:00        │
   └─────┴──────────┴────────┴─────────────────┘

STEP 2: Log view Product B
   ProductView Table:
   ┌─────┬──────────┬────────┬─────────────────┐
   │ id  │ product  │ count  │ viewedAt        │
   ├─────┼──────────┼────────┼─────────────────┤
   │ 1   │ A        │ 1      │ 14:00:00        │
   │ 2   │ B        │ 1      │ 14:05:00        │  ← Most recent
   └─────┴──────────┴────────┴─────────────────┘

STEP 3: Log view Product A again (at 14:10:00)
   
   Check: Does (sessionId, productA) exist? → YES
   Action: UPDATE instead of INSERT
   
   ProductView Table:
   ┌─────┬──────────┬────────┬─────────────────┐
   │ id  │ product  │ count  │ viewedAt        │
   ├─────┼──────────┼────────┼─────────────────┤
   │ 1   │ A        │ 2      │ 14:10:00        │  ← Updated! ✓
   │ 2   │ B        │ 1      │ 14:05:00        │
   └─────┴──────────┴────────┴─────────────────┘

   Retrieved in order (DESC by viewedAt):
   ─────────────────────────────────────────
   [A (14:10:00), B (14:05:00)]  ✓
   
   Result: A moved to front, not duplicated!
```

---

## Automatic Cleanup Flow

```
Scenario: 11 products viewed, cleanup triggered

BEFORE Cleanup (11 products):
   ProductView Ordered by viewedAt DESC:
   ┌────────────────────────────────────────┐
   │ 1.  Product A  (14:50:00)              │
   │ 2.  Product B  (14:45:00)              │
   │ 3.  Product C  (14:40:00)              │
   │ 4.  Product D  (14:35:00)              │
   │ 5.  Product E  (14:30:00)              │
   │ 6.  Product F  (14:25:00)              │
   │ 7.  Product G  (14:20:00)              │
   │ 8.  Product H  (14:15:00)              │
   │ 9.  Product I  (14:10:00)              │
   │ 10. Product J  (14:05:00)              │
   │ 11. Product K  (14:00:00) ← REMOVE ME! │
   └────────────────────────────────────────┘

Cleanup Logic:
   if (count > MAX_RECENT_PRODUCTS) {
     Delete views beyond position 10
   }

AFTER Cleanup (10 products):
   ProductView Ordered by viewedAt DESC:
   ┌────────────────────────────────────────┐
   │ 1.  Product A  (14:50:00)              │
   │ 2.  Product B  (14:45:00)              │
   │ 3.  Product C  (14:40:00)              │
   │ 4.  Product D  (14:35:00)              │
   │ 5.  Product E  (14:30:00)              │
   │ 6.  Product F  (14:25:00)              │
   │ 7.  Product G  (14:20:00)              │
   │ 8.  Product H  (14:15:00)              │
   │ 9.  Product I  (14:10:00)              │
   │ 10. Product J  (14:05:00)              │
   └────────────────────────────────────────┘

   Result: Oldest product K deleted ✓
```

---

## Database Query Performance

```
Efficient Query with Index:

Index Definition:
   CREATE INDEX idx_session_time 
   ON product_views (guest_session_id, viewed_at DESC)

Query: Get 10 most recent products for a session
   SELECT * FROM product_views
   WHERE guest_session_id = 'uuid'
   ORDER BY viewed_at DESC
   LIMIT 10

Performance:
   ✓ Uses index for WHERE clause (guest_session_id)
   ✓ Index is ordered DESC (matches ORDER BY)
   ✓ LIMIT 10 stops after finding 10 rows
   ✓ Result: O(10) instead of O(n)

Execution Plan:
   ┌─────────────────────────────────┐
   │ Using Index (idx_session_time)  │
   │ - Seek to session ID            │
   │ - Read 10 rows DESC             │
   │ - Return results                │
   └─────────────────────────────────┘
   
   Time Complexity: O(log n + 10) = O(1) for small n
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────┐
│             Angular Application                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Homepage                                           │
│  ┌───────────────────────────────────────────┐    │
│  │ Recently Viewed Strip (Component)         │    │
│  └───────────────────────────────────────────┘    │
│         ↕ (read: getRecentlyViewed)                │
│         ↕ (write: logProductView)                  │
│                                                     │
│  Product Detail Page                                │
│  ┌───────────────────┐  ┌─────────────────────┐   │
│  │ Product Display   │  │ Recently Viewed     │   │
│  │                   │  │ Strip (Component)   │   │
│  │ logProductView()  │  └─────────────────────┘   │
│  │    ↓ (on load)    │         ↕ (read)           │
│  └───────────────────┘         ↕                  │
│                                 ↕                  │
│  ┌─────────────────────────────────────────┐     │
│  │ ProductViewService                      │     │
│  │ - sessionId (UUID)                      │     │
│  │ - logProductView()                      │     │
│  │ - getRecentlyViewed()                   │     │
│  │ - getRecentlyViewedWithDetails()        │     │
│  │ - clearRecentlyViewed()                 │     │
│  └─────────────────────────────────────────┘     │
│                    ↕ HTTP REST API                │
└─────────────────────────────────────────────────────┘
         POST /api/product-views/log
         GET /api/product-views/recently-viewed
         DELETE /api/product-views/clear

┌─────────────────────────────────────────────────────┐
│          Spring Boot Backend                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ProductViewController                              │
│  ├─ @PostMapping("/log")                           │
│  ├─ @GetMapping("/recently-viewed")                │
│  ├─ @GetMapping("/recently-viewed/detailed")       │
│  └─ @DeleteMapping("/clear")                       │
│         ↓                                           │
│  ProductViewService                                 │
│  ├─ logProductView()                               │
│  ├─ getRecentlyViewed()                            │
│  ├─ getRecentlyViewedWithDetails()                 │
│  ├─ clearRecentlyViewed()                          │
│  └─ cleanupOldViews()                              │
│         ↓                                           │
│  ProductViewRepository (JPA)                        │
│  ├─ findByGuestSessionIdOrderByViewedAtDesc()      │
│  ├─ findByGuestSessionIdAndProductId()             │
│  ├─ deleteByGuestSessionId()                       │
│  └─ countByGuestSessionId()                        │
│         ↓                                           │
│  H2 Database (product_views table)                 │
│  ├─ Stores view records                            │
│  ├─ Indexed on (guest_session_id, viewed_at DESC)  │
│  └─ Auto-created via JPA                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## State Flow Diagram

```
┌────────────────────────────────────────────────────────┐
│         Guest User Session Lifecycle                   │
└────────────────────────────────────────────────────────┘

1. INITIAL STATE
   ┌──────────────────────────────────────┐
   │ User visits website for first time   │
   │ No guestSessionId yet                │
   └──────────────────────────────────────┘
           │
           ↓
2. SESSION CREATION
   ┌──────────────────────────────────────┐
   │ Frontend generates UUID              │
   │ guestSessionId = "550e8400-..."      │
   │ Stored in localStorage               │
   │ Persists across page reloads         │
   └──────────────────────────────────────┘
           │
           ↓
3. VIEWS LOGGED
   ┌──────────────────────────────────────┐
   │ User visits Product Detail Pages     │
   │ Each view logged to database         │
   │ Stored with timestamp                │
   │ Max 10 items maintained              │
   └──────────────────────────────────────┘
           │
           ├─→ View Product A (14:00:00) [count=1]
           ├─→ View Product B (14:05:00) [count=1]
           ├─→ View Product C (14:10:00) [count=1]
           ├─→ View Product A (14:15:00) [count=2] ← Re-view!
           │   (moves to front, +1 count)
           └─→ View Products D-K (beyond 10)
               (K deleted automatically)
           │
           ↓
4. RETRIEVAL
   ┌──────────────────────────────────────┐
   │ Frontend requests recently viewed    │
   │ GET /api/product-views/              │
   │     recently-viewed?                 │
   │     guestSessionId=550e8400-...      │
   │ Returns 10 most recent items         │
   │ Ordered by timestamp DESC            │
   └──────────────────────────────────────┘
           │
           ↓
5. DISPLAY
   ┌──────────────────────────────────────┐
   │ Recently Viewed Strip Rendered       │
   │ [A] [C] [B] [D] [E] [F] [G] [H] ...  │
   │ (Most recent first)                  │
   │ User can click to view products      │
   └──────────────────────────────────────┘
           │
           ├─→ User clicks product
           │   (Navigate to PDP)
           │   (View gets logged)
           └─→ User clicks "Clear History"
               (All views deleted)
           │
           ↓
6. CLEANUP (Optional)
   ┌──────────────────────────────────────┐
   │ User clears browser data or          │
   │ Generates new session                │
   │ Previous views are forgotten         │
   │ New empty session starts             │
   └──────────────────────────────────────┘
```

---

## Endpoint Routing Map

```
HTTP Requests → Spring Routing → Service Logic

POST /api/product-views/log
    ↓
    @PostMapping("/log")
    logProductView()
    ↓
    ProductViewService.logProductView(guestSessionId, productId)
    ├─ Validate product exists
    ├─ Check if already viewed
    ├─ INSERT or UPDATE
    ├─ Cleanup if > 10
    └─ Return confirmation

GET /api/product-views/recently-viewed
    ↓
    @GetMapping("/recently-viewed")
    getRecentlyViewed()
    ↓
    ProductViewService.getRecentlyViewed(guestSessionId)
    ├─ Query with pagination (max 10)
    ├─ Order by viewedAt DESC
    ├─ Map to lightweight DTO
    └─ Return list

GET /api/product-views/recently-viewed/detailed
    ↓
    @GetMapping("/recently-viewed/detailed")
    getRecentlyViewedWithDetails()
    ↓
    ProductViewService.getRecentlyViewedWithDetails(guestSessionId)
    ├─ Query with pagination (max 10)
    ├─ Order by viewedAt DESC
    ├─ Map to detailed DTO with product info
    └─ Return list

DELETE /api/product-views/clear
    ↓
    @DeleteMapping("/clear")
    clearRecentlyViewed()
    ↓
    ProductViewService.clearRecentlyViewed(guestSessionId)
    ├─ Delete all views for session
    └─ Return 204 No Content
```

---

## Session ID Lifecycle

```
localStorage Key: "guest_session_id"

┌─ First Visit ─────────────────────┐
│  Check localStorage               │
│  ❌ No value found                │
│  → Generate new UUID              │
│  → Save to localStorage           │
│  Example: "550e8400-e29b-41d4..." │
└───────────────────────────────────┘
         ↓
┌─ Subsequent Visits ───────────────┐
│  Check localStorage               │
│  ✓ Value found: "550e8400-..."    │
│  → Reuse existing ID              │
│  Views continue in same session   │
└───────────────────────────────────┘
         ↓
┌─ Browser Refresh ─────────────────┐
│  localStorage persists            │
│  Same session ID retrieved        │
│  Views not lost                   │
└───────────────────────────────────┘
         ↓
┌─ Clear Browser Data ──────────────┐
│  localStorage cleared             │
│  Next visit gets new ID           │
│  New session starts               │
│  Previous views forgotten         │
└───────────────────────────────────┘
```

---

These diagrams show:
✓ Overall system architecture
✓ Request/response flows
✓ Deduplication logic
✓ Automatic cleanup mechanism
✓ Database query optimization
✓ Component interactions
✓ State lifecycle
✓ API routing


