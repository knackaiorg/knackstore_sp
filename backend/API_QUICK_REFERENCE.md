# Recently Viewed Products - API Quick Reference

## Quick API Summary

### 1. Log Product View
**Endpoint:** `POST /api/product-views/log`  
**Status:** 201 Created

```bash
curl -X POST http://localhost:8080/api/product-views/log \
  -H "Content-Type: application/json" \
  -d '{
    "guestSessionId": "550e8400-e29b-41d4-a716-446655440000",
    "productId": 1
  }'
```

**Response:**
```json
{
  "productViewId": 5,
  "productId": 1,
  "viewedAt": "2026-06-19T14:30:00",
  "message": "Product view logged successfully"
}
```

---

### 2. Get Recent Products (Quick)
**Endpoint:** `GET /api/product-views/recently-viewed`  
**Status:** 200 OK  
**Query Param:** `guestSessionId` (required)

```bash
curl "http://localhost:8080/api/product-views/recently-viewed?guestSessionId=550e8400-e29b-41d4-a716-446655440000"
```

**Response:**
```json
{
  "guestSessionId": "550e8400-e29b-41d4-a716-446655440000",
  "totalViewCount": 15,
  "returnedCount": 10,
  "products": [
    {
      "id": 5,
      "productId": 1,
      "productCode": "LAPTOP-001",
      "productName": "MacBook Pro 16",
      "productImage": "https://...",
      "productPrice": 2499.99,
      "viewedAt": "2026-06-19T14:30:00"
    }
  ]
}
```

---

### 3. Get Recent Products (With Details)
**Endpoint:** `GET /api/product-views/recently-viewed/detailed`  
**Status:** 200 OK  
**Query Param:** `guestSessionId` (required)

```bash
curl "http://localhost:8080/api/product-views/recently-viewed/detailed?guestSessionId=550e8400-e29b-41d4-a716-446655440000"
```

**Response:** Array of ProductViewDTO with full ProductDTO details

---

### 4. Clear Recently Viewed
**Endpoint:** `DELETE /api/product-views/clear`  
**Status:** 204 No Content  
**Query Param:** `guestSessionId` (required)

```bash
curl -X DELETE "http://localhost:8080/api/product-views/clear?guestSessionId=550e8400-e29b-41d4-a716-446655440000"
```

**Response:** (empty body, 204 status)

---

## Frontend Integration Checklist

- [ ] Generate and store unique `guestSessionId` in localStorage
- [ ] Call `POST /api/product-views/log` when user views a product (PDP page load)
- [ ] Call `GET /api/product-views/recently-viewed` to fetch recently viewed products
- [ ] Display products in horizontal scrollable strip
- [ ] Add "Clear History" button that calls `DELETE /api/product-views/clear`
- [ ] Handle error responses gracefully

---

## Key Points

✅ **Up to 10 products** - Automatically cleaned up  
✅ **Deduplication** - No duplicates, moved to front on re-visit  
✅ **Session-based** - One session ID per guest  
✅ **Fast queries** - Indexed database queries  
✅ **RESTful** - Standard HTTP methods and status codes  

---

## Implementation Status

✅ Entity Model (ProductView.java)  
✅ Repository (ProductViewRepository.java)  
✅ Service Layer (ProductViewService.java)  
✅ Request/Response DTOs (ProductViewDTO.java)  
✅ REST Controller (ProductViewController.java)  
✅ Compilation verified  
✅ Documentation complete  

**Ready for Frontend Integration!**


