# Quick Order Feature – API Reference

> Base URL: `http://localhost:8080`

---

## 1. Download CSV Template

**`GET /api/quick-order/download-template`**

Downloads a sample two-column CSV template for quick order.

- **Auth:** None
- **Response:** File download (`QuickOrder_Template.csv`)

---

## 2. Upload CSV for Quick Order

**`POST /api/quick-order/upload-csv`**

Parses a two-column CSV (SKU, Quantity), validates each row, and returns a staging list of valid items plus any errors.

- **Auth:** None
- **Content-Type:** `multipart/form-data`

### Request

| Parameter | Type             | Required | Description              |
|-----------|------------------|----------|--------------------------|
| `file`    | `MultipartFile`  | Yes      | `.csv` file (SKU, Qty)   |

**Sample CSV:**
```csv
SKU,Quantity
PHONE-001,2
LAPTOP-001,1
HEAD-001,3
INVALID-SKU,2
ACC-002,0
```

### Response `200 OK`

```json
{
  "sessionId": "e6121dcf-cb9f-4419-b534-6d929a9198ed",
  "totalRows": 5,
  "validCount": 3,
  "errorCount": 2,
  "stagingItems": [
    {
      "entryId": 1,
      "skuCode": "PHONE-001",
      "productName": "AlphaPhone Pro 15",
      "price": 999.99,
      "quantity": 2,
      "availableStock": 150
    },
    {
      "entryId": 2,
      "skuCode": "LAPTOP-001",
      "productName": "UltraBook Pro 14",
      "price": 1999.99,
      "quantity": 1,
      "availableStock": 60
    },
    {
      "entryId": 3,
      "skuCode": "HEAD-001",
      "productName": "SoundMax WH-1000XM6",
      "price": 349.99,
      "quantity": 3,
      "availableStock": 200
    }
  ],
  "errors": [
    {
      "rowNumber": 5,
      "skuCode": "INVALID-SKU",
      "productName": null,
      "quantity": 2,
      "reason": "NOT_FOUND",
      "message": "SKU INVALID-SKU cannot be added because it was not found."
    },
    {
      "rowNumber": 6,
      "skuCode": "ACC-002",
      "productName": null,
      "quantity": 0,
      "reason": "INVALID_QUANTITY",
      "message": "SKU ACC-002 cannot be added because the quantity must be greater than 0."
    }
  ]
}
```

### Error Reason Codes

| Code               | Description                                      | Message Format                                                                 |
|--------------------|--------------------------------------------------|--------------------------------------------------------------------------------|
| `NOT_FOUND`        | SKU does not exist in catalog                    | `SKU {X} cannot be added because it was not found.`                            |
| `OUT_OF_STOCK`     | SKU exists but stock is 0                        | `SKU {X} ({Product Name}) cannot be added because it is out of stock.`         |
| `INVALID_QUANTITY`  | Quantity is ≤ 0 or not a number                  | `SKU {X} cannot be added because the quantity must be greater than 0.`         |
| `INVALID_FORMAT`   | Row doesn't have two columns                     | `SKU {X} cannot be added because the row format is invalid. Expected: SKU,Quantity` |

### Error Responses

| Status | Condition                        |
|--------|----------------------------------|
| `400`  | Empty file or non-`.csv` file    |

---

## 3. Get Staging List

**`GET /api/quick-order/staging/{sessionId}`**

Retrieves the staging list for a previously uploaded CSV session.

- **Auth:** None

### Path Parameters

| Parameter   | Type     | Description                          |
|-------------|----------|--------------------------------------|
| `sessionId` | `String` | Session ID returned from upload-csv  |

### Response `200 OK`

Same structure as the upload response (without errors).

```json
{
  "sessionId": "e6121dcf-cb9f-4419-b534-6d929a9198ed",
  "totalRows": 3,
  "validCount": 3,
  "errorCount": 0,
  "stagingItems": [
    {
      "entryId": 1,
      "skuCode": "PHONE-001",
      "productName": "AlphaPhone Pro 15",
      "price": 999.99,
      "quantity": 2,
      "availableStock": 150
    }
  ],
  "errors": []
}
```

---

## 4. Search Products (Auto-complete)

**`GET /api/quick-order/search?q={query}`**

Searches products by name or SKU code for the Quick Order page auto-complete. Returns stock availability so out-of-stock items can be blocked on the UI.

- **Auth:** None
- **Min query length:** 2 characters (returns empty below that)

### Query Parameters

| Parameter | Type     | Required | Description                  |
|-----------|----------|----------|------------------------------|
| `q`       | `String` | Yes      | Search term (name or SKU)    |

### Response `200 OK`

```json
{
  "results": [
    {
      "productId": 1,
      "skuCode": "PHONE-001",
      "productName": "AlphaPhone Pro 15",
      "brand": "AlphaTech",
      "imageUrl": "https://picsum.photos/seed/phone-001/800/600",
      "price": 999.99,
      "availableStock": 150,
      "inStock": true
    },
    {
      "productId": 2,
      "skuCode": "PHONE-002",
      "productName": "GalaxyEdge S25",
      "brand": "StellarTech",
      "imageUrl": "https://picsum.photos/seed/phone-002/800/600",
      "price": 899.99,
      "availableStock": 120,
      "inStock": true
    }
  ]
}
```

**Frontend behaviour:**
- Show all results in the auto-complete dropdown.
- If `inStock` is `false`, visually disable the item and prevent selection/adding.

---

## 5. Add All Staging Items to Cart

**`POST /api/quick-order/add-all-to-cart/{sessionId}`**

Re-verifies live stock for all staging items and moves valid ones to the customer's shopping cart. Items that went out of stock since upload remain in the staging list with an error.

- **Auth:** JWT required (`Authorization: Bearer <token>`)

### Path Parameters

| Parameter   | Type     | Description                          |
|-------------|----------|--------------------------------------|
| `sessionId` | `String` | Session ID returned from upload-csv  |

### Response `200 OK`

```json
{
  "totalItems": 7,
  "addedCount": 6,
  "failedCount": 1,
  "addedItems": [
    {
      "entryId": 1,
      "skuCode": "PHONE-001",
      "productName": "AlphaPhone Pro 15",
      "quantity": 2,
      "unitPrice": 999.99,
      "mergedWithExisting": false
    },
    {
      "entryId": 2,
      "skuCode": "LAPTOP-001",
      "productName": "UltraBook Pro 14",
      "quantity": 1,
      "unitPrice": 1999.99,
      "mergedWithExisting": true
    }
  ],
  "failedItems": [
    {
      "entryId": 5,
      "skuCode": "TAB-001",
      "productName": "SlateBook Pro 12.9",
      "quantity": 2,
      "reason": "OUT_OF_STOCK",
      "message": "SKU TAB-001 (SlateBook Pro 12.9) cannot be added because it is out of stock."
    }
  ]
}
```

### Response Fields

| Field                         | Type      | Description                                                  |
|-------------------------------|-----------|--------------------------------------------------------------|
| `totalItems`                  | `int`     | Total staging items processed                                |
| `addedCount`                  | `int`     | Items successfully added to cart                             |
| `failedCount`                 | `int`     | Items blocked (out of stock / not found)                     |
| `addedItems[].mergedWithExisting` | `boolean` | `true` if quantity was merged with an existing cart entry |
| `failedItems[].reason`        | `String`  | `OUT_OF_STOCK` or `NOT_FOUND`                                |
| `failedItems[].message`       | `String`  | Human-readable error message                                 |

### Behaviour Notes

- Successfully added items are **removed from the staging list**.
- Failed items **remain in the staging list** and can be retried later.
- If the product already exists in the cart, quantities are **merged** (`mergedWithExisting: true`).
- Any applied promo code is cleared when cart is modified.

---

## API Summary Table

| #  | Method | Endpoint                                    | Auth     | Description                           |
|----|--------|---------------------------------------------|----------|---------------------------------------|
| 1  | GET    | `/api/quick-order/download-template`        | None     | Download sample CSV template          |
| 2  | POST   | `/api/quick-order/upload-csv`               | None     | Upload & parse CSV → staging list     |
| 3  | GET    | `/api/quick-order/staging/{sessionId}`      | None     | Retrieve staging list by session      |
| 4  | GET    | `/api/quick-order/search?q={query}`         | None     | Auto-complete search by name or SKU   |
| 5  | POST   | `/api/quick-order/add-all-to-cart/{sessionId}` | JWT   | Add all staging items to cart         |

---

## Swagger UI

All APIs are also available on Swagger UI at:
```
http://localhost:8080/swagger-ui.html
```
Look for the **"Quick Order"** tag.
