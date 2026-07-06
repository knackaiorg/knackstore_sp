# Promo Code Feature - Implementation Guide

## Overview
The promo code feature allows customers to apply discount codes to their shopping cart. The system supports two types of discounts: **PERCENTAGE** and **FIXED** amount discounts.

## Components Created

### 1. Entity: PromoCode
**File:** `model/PromoCode.java`
- Stores promo code information in the database
- Fields:
  - `code`: Unique promo code string (e.g., "WELCOME10")
  - `discountType`: PERCENTAGE or FIXED
  - `discountValue`: Discount amount (percentage value or fixed amount)
  - `minimumOrderAmount`: Optional minimum cart value requirement
  - `active`: Boolean flag to enable/disable codes

### 2. Repository: PromoCodeRepository
**File:** `repository/PromoCodeRepository.java`
- JPA repository interface for PromoCode entity
- Custom query: `findByCodeIgnoreCaseAndActiveTrue(String code)`

### 3. Service: PromoCodeService
**File:** `service/PromoCodeService.java`
- Business logic for promo code operations
- Methods:
  - `applyPromoCode(String email, String code)`: Apply promo code to cart
  - `removePromoCode(String email)`: Remove applied promo code from cart

### 4. Controller: PromoCodeController
**File:** `controller/PromoCodeController.java`
- REST endpoints for promo code operations
- Base path: `/api/promo-codes`

### 5. DTOs: PromoCodeDTO
**File:** `dto/PromoCodeDTO.java`
- `ApplyRequest`: Request body for applying promo code
- `ApplyResponse`: Response with success status and message

## Database Changes

### Cart Table
Added fields:
- `appliedPromoCode`: String - stores the applied promo code
- `discountAmount`: Double - stores the calculated discount amount

### Order Table
Added fields:
- `subtotal`: Double - order subtotal before discount
- `appliedPromoCode`: String - promo code used (if any)
- `discountAmount`: Double - discount applied to the order

## API Endpoints

### Apply Promo Code
```http
POST /api/promo-codes/apply
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "code": "WELCOME10"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Promo code applied successfully",
  "code": "WELCOME10",
  "discountAmount": 50.0
}
```

**Error Responses:**

1. Invalid Code:
```json
{
  "success": false,
  "message": "This promo code is not valid"
}
```

2. Minimum Order Not Met:
```json
{
  "success": false,
  "message": "This code requires a minimum cart value of ₹500.00"
}
```

3. Code Already Applied:
```json
{
  "success": false,
  "message": "A promo code is already applied. Please remove it before applying a new one."
}
```

### Remove Promo Code
```http
DELETE /api/promo-codes/remove
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "Promo code removed successfully"
}
```

## Pre-seeded Promo Codes

The following promo codes are automatically seeded in the database:

| Code | Type | Discount | Minimum Cart Value |
|------|------|----------|-------------------|
| WELCOME10 | PERCENTAGE | 10% | ₹500 |
| FLAT500 | FIXED | ₹500 | ₹2,000 |
| SAVE20 | PERCENTAGE | 20% | ₹1,000 |
| MEGA1000 | FIXED | ₹1,000 | ₹5,000 |
| FIRST15 | PERCENTAGE | 15% | No minimum |

## Business Rules

1. **Single Code Per Cart**: Only one promo code can be applied to a cart at a time
2. **Minimum Order Amount**: 
   - Required for FIXED discount codes
   - Optional for PERCENTAGE discount codes
3. **Validation on Apply**: System validates:
   - Code exists and is active
   - Minimum cart value is met (if applicable)
   - No code is already applied
4. **Cart Modification**: When cart entries are added, updated, or removed:
   - Applied promo code is automatically cleared
   - Customer must re-apply the code
5. **Order Placement**: When an order is placed:
   - Promo code and discount amount are saved to the order record
   - Cart is cleared including promo code

## Cart Response Format

Updated CartDTO includes discount information:

```json
{
  "id": 1,
  "subtotal": 1500.00,
  "appliedPromoCode": "WELCOME10",
  "discountAmount": 150.00,
  "totalPrice": 1350.00,
  "totalItems": 3,
  "entries": [...]
}
```

## Order Response Format

Updated OrderDTO includes discount information:

```json
{
  "id": 1,
  "orderCode": "ORD-ABC12345",
  "status": "PLACED",
  "subtotal": 1500.00,
  "appliedPromoCode": "WELCOME10",
  "discountAmount": 150.00,
  "totalPrice": 1350.00,
  "paymentMethod": "COD",
  "placedDate": "2026-07-03T10:30:00",
  "entries": [...]
}
```

## Testing the Feature

### Test Flow:
1. Login as demo user: `demo@knack.com` / `Demo@1234`
2. Add items to cart (GET `/api/cart`)
3. Apply promo code (POST `/api/promo-codes/apply`)
4. Verify discount in cart response
5. Place order (POST `/api/orders`)
6. Verify discount saved in order details

### Test Scenarios:
- ✅ Apply valid promo code with sufficient cart value
- ✅ Try to apply invalid code
- ✅ Try to apply code with insufficient cart value
- ✅ Try to apply second code when one is already applied
- ✅ Remove promo code
- ✅ Modify cart and verify promo code is cleared
- ✅ Place order and verify discount is saved

## Frontend Integration

The frontend needs to:
1. Add promo code input field and "Apply" button on cart page
2. Display discount as a negative line item in cart summary
3. Show revised total after discount
4. Provide "Remove" button to clear applied promo code
5. Handle error messages appropriately
6. Re-apply promo code after cart modifications (if needed)

## Swagger Documentation

Access API documentation at: `http://localhost:8080/swagger-ui.html`

All promo code endpoints are documented under the "Promo Codes" tag.
