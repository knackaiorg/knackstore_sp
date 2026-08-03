# Quick Order Feature – Technical Design Document

---

## 1. Overview

The Quick Order feature enables Bulk Buyers and Casual Speed Buyers to rapidly add multiple products to their cart via CSV upload or manual search, with real-time stock validation and clear error feedback.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Angular)                          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ CSV Upload   │  │ Search Bar   │  │ Add All to Cart Button   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
└─────────┼──────────────────┼──────────────────────┼─────────────────┘
          │                  │                      │
          ▼                  ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        REST API Layer (Spring Boot)                   │
│                                                                     │
│  POST /api/quick-order/upload-csv                                   │
│  GET  /api/quick-order/staging/{sessionId}                          │
│  GET  /api/quick-order/search?q={query}                             │
│  POST /api/quick-order/add-all-to-cart                              │
│  GET  /api/quick-order/download-template                            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Service Layer                                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    QuickOrderService                          │    │
│  │                                                             │    │
│  │  • processCsvUpload(file)                                   │    │
│  │  • getStagingList(sessionId)                                │    │
│  │  • searchProducts(query)                                    │    │
│  │  • addAllToCart(request, email)                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                               │                                     │
│              ┌────────────────┼────────────────┐                    │
│              ▼                ▼                ▼                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │CartRepository│  │ProductRepo   │  │QuickOrderRepo│              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     H2 In-Memory Database                             │
│                                                                     │
│  Tables: products, carts, cart_entries, quick_order_entries          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Request/Response Flow Diagrams

### 3.1 CSV Upload Flow

```
User                    Controller              Service                 Repository          DB
 │                          │                      │                       │                │
 │── POST /upload-csv ─────►│                      │                       │                │
 │   (multipart .csv)       │                      │                       │                │
 │                          │── processCsvUpload()─►│                       │                │
 │                          │                      │── Parse CSV rows      │                │
 │                          │                      │                       │                │
 │                          │                      │── findByCode(sku) ───►│───── SELECT ──►│
 │                          │                      │◄── Product/null ──────│◄────────────────│
 │                          │                      │                       │                │
 │                          │                      │── Validate stock      │                │
 │                          │                      │                       │                │
 │                          │                      │── saveAll(entries) ───►│───── INSERT ──►│
 │                          │                      │◄── saved entries ─────│◄────────────────│
 │                          │                      │                       │                │
 │                          │◄── Response ─────────│                       │                │
 │◄── 200 JSON ────────────│                      │                       │                │
 │   {sessionId,            │                      │                       │                │
 │    stagingItems[],       │                      │                       │                │
 │    errors[]}             │                      │                       │                │
```

### 3.2 Add All to Cart Flow

```
User                    Controller              Service                 Repository          DB
 │                          │                      │                       │                │
 │── POST /add-all-to-cart─►│                      │                       │                │
 │   {items:[{sku,qty}]}    │                      │                       │                │
 │   + JWT Token            │                      │                       │                │
 │                          │── addAllToCart() ────►│                       │                │
 │                          │                      │── findByEmail() ─────►│───── SELECT ──►│
 │                          │                      │◄── Customer ──────────│◄────────────────│
 │                          │                      │                       │                │
 │                          │                      │── getOrCreateCart() ──►│───── SELECT ──►│
 │                          │                      │◄── Cart ──────────────│◄────────────────│
 │                          │                      │                       │                │
 │                          │                      │ FOR EACH item:        │                │
 │                          │                      │── findByCode(sku) ───►│───── SELECT ──►│
 │                          │                      │◄── Product ───────────│◄────────────────│
 │                          │                      │                       │                │
 │                          │                      │── Re-verify stock     │                │
 │                          │                      │── Merge or Add entry  │                │
 │                          │                      │                       │                │
 │                          │                      │── save(cart) ─────────►│───── UPDATE ──►│
 │                          │                      │◄── saved ─────────────│◄────────────────│
 │                          │                      │                       │                │
 │                          │◄── Response ─────────│                       │                │
 │◄── 200 JSON ────────────│                      │                       │                │
 │   {addedItems[],         │                      │                       │                │
 │    failedItems[]}        │                      │                       │                │
```

---

## 4. File Changes Summary

### 4.1 New Files Created

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `src/main/java/com/knack/store/controller/QuickOrderController.java` | REST controller with 5 endpoints |
| 2 | `src/main/java/com/knack/store/service/QuickOrderService.java` | Business logic: CSV parsing, search, cart operations |
| 3 | `src/main/java/com/knack/store/model/QuickOrderEntry.java` | JPA entity for staging list persistence |
| 4 | `src/main/java/com/knack/store/repository/QuickOrderEntryRepository.java` | Spring Data JPA repository |
| 5 | `src/main/java/com/knack/store/dto/QuickOrderCsvUploadResponse.java` | Response DTO for CSV upload (staging + errors) |
| 6 | `src/main/java/com/knack/store/dto/QuickOrderSearchResponse.java` | Response DTO for product search |
| 7 | `src/main/java/com/knack/store/dto/AddAllToCartRequest.java` | Request DTO for add-all-to-cart |
| 8 | `src/main/java/com/knack/store/dto/AddAllToCartResponse.java` | Response DTO for add-all-to-cart |
| 9 | `src/main/resources/files/QuickOrder_Template.csv` | Downloadable CSV template |
| 10 | `sample-quick-order.csv` | Sample CSV for testing |
| 11 | `QUICK_ORDER_API_REFERENCE.md` | API documentation for FE integration |

### 4.2 Modified Files

| # | File Path | Change Description |
|---|-----------|-------------------|
| 1 | `src/main/java/com/knack/store/config/SecurityConfig.java` | Added `/api/quick-order/**` to `permitAll()` |
| 2 | `src/main/java/com/knack/store/repository/ProductRepository.java` | Added `findTop10ByNameOrCodeContainingIgnoreCase()` query |
| 3 | `src/main/java/com/knack/store/config/DataInitializer.java` | Set `HEAD-002` stock to 0 for testing |

---

## 5. Database Schema

### 5.1 New Table: `quick_order_entries`

```sql
CREATE TABLE quick_order_entries (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id      VARCHAR(255) NOT NULL,
    sku_code        VARCHAR(255) NOT NULL,
    product_name    VARCHAR(255) NOT NULL,
    price           DOUBLE,
    quantity        INT NOT NULL,
    available_stock INT,
    valid           BOOLEAN DEFAULT TRUE,
    error_message   VARCHAR(255),
    created_at      TIMESTAMP
);
```

### 5.2 Entity Relationship

```
┌──────────────────────┐       ┌──────────────────┐
│  quick_order_entries │       │     products     │
├──────────────────────┤       ├──────────────────┤
│ id (PK)              │       │ id (PK)          │
│ session_id           │──────►│ code (unique)    │
│ sku_code             │ lookup│ name             │
│ product_name         │       │ stock_quantity   │
│ price                │       │ base_price       │
│ quantity             │       └──────────────────┘
│ available_stock      │
│ valid                │       ┌──────────────────┐
│ error_message        │       │      carts       │
│ created_at           │       ├──────────────────┤
└──────────────────────┘       │ id (PK)          │
                               │ customer_id (FK) │
                               └────────┬─────────┘
                                        │ 1:N
                               ┌────────▼─────────┐
                               │   cart_entries    │
                               ├──────────────────┤
                               │ id (PK)          │
                               │ cart_id (FK)     │
                               │ product_id (FK)  │
                               │ variant_id (FK)  │
                               │ quantity         │
                               │ unit_price       │
                               │ reserved_until   │
                               └──────────────────┘
```

---

## 6. API Endpoints

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 1 | GET | `/api/quick-order/download-template` | None | Download CSV template |
| 2 | POST | `/api/quick-order/upload-csv` | None | Upload & validate CSV → staging list |
| 3 | GET | `/api/quick-order/staging/{sessionId}` | None | Retrieve staging list |
| 4 | GET | `/api/quick-order/search?q={query}` | None | Auto-complete search (name/SKU) |
| 5 | POST | `/api/quick-order/add-all-to-cart` | JWT | Add items to cart with stock re-check |

---

## 7. Validation Rules

### 7.1 CSV Upload Validation

| Rule | Error Code | Message |
|------|------------|---------|
| Row has < 2 columns | `INVALID_FORMAT` | SKU {X} cannot be added because the row format is invalid. |
| Quantity ≤ 0 | `INVALID_QUANTITY` | SKU {X} cannot be added because the quantity must be greater than 0. |
| Quantity not a number | `INVALID_QUANTITY` | SKU {X} cannot be added because the quantity '{Y}' is not a valid number. |
| SKU not in catalog | `NOT_FOUND` | SKU {X} cannot be added because it was not found. |
| SKU out of stock | `OUT_OF_STOCK` | SKU {X} ({Product Name}) cannot be added because it is out of stock. |

### 7.2 Add All to Cart Validation

| Rule | Error Code | Message |
|------|------------|---------|
| SKU not found | `NOT_FOUND` | SKU {X} cannot be added because it was not found. |
| Stock became 0 since staging | `OUT_OF_STOCK` | SKU {X} ({Product Name}) cannot be added because it is out of stock. |

---

## 8. Security Configuration

- Endpoints under `/api/quick-order/**` are publicly accessible (no JWT) **except** `add-all-to-cart` which requires authentication.
- The `add-all-to-cart` endpoint uses `@AuthenticationPrincipal UserDetails` to identify the customer and associate the cart.

---

## 9. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Session-based staging | Each CSV upload generates a unique `sessionId` so multiple uploads don't conflict |
| No user auth for upload/search | Allows guests to explore; cart commitment requires login |
| Stock re-verification on cart add | Prevents stale inventory issues when items sit in staging |
| Cart quantity merging | If product already in cart, quantities are summed rather than creating duplicates |
| Promo code cleared on cart modify | Consistent with existing cart behaviour across the application |
| Search matches name OR SKU code | Enables both casual name searches and precise SKU lookups |
| `inStock` flag in search results | Frontend can immediately grey out / block out-of-stock items |

---

## 10. Testing

### Test Data

| SKU | Product | Stock | Purpose |
|-----|---------|-------|---------|
| PHONE-001 | AlphaPhone Pro 15 | 150 | Valid product |
| LAPTOP-001 | UltraBook Pro 14 | 60 | Valid product |
| HEAD-001 | SoundMax WH-1000XM6 | 200 | Valid product |
| HEAD-002 | AirBuds Pro 2 | **0** | Out-of-stock testing |
| INVALID-SKU | — | — | Not-found testing |

### Sample cURL Commands

```bash
# 1. Upload CSV
curl -X POST http://localhost:8080/api/quick-order/upload-csv \
  -F "file=@sample-quick-order.csv"

# 2. Search by SKU
curl "http://localhost:8080/api/quick-order/search?q=PHONE"

# 3. Search by name
curl "http://localhost:8080/api/quick-order/search?q=alpha"

# 4. Login to get token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@knack.com","password":"Demo@1234"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# 5. Add all to cart
curl -X POST http://localhost:8080/api/quick-order/add-all-to-cart \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"skuCode":"PHONE-001","quantity":2},{"skuCode":"HEAD-002","quantity":1}]}'
```

---

## 11. User Stories Covered

| US# | Title | Status |
|-----|-------|--------|
| US-03 | Uploading and Staging a CSV | ✅ Implemented |
| US-04 | Immediate Validation Feedback for CSV Rows | ✅ Implemented |
| US-05 | Manual Product Search Validation | ✅ Implemented |
| US-07 | Add All to Cart with Stock Re-verification | ✅ Implemented |
