# Promo Code Feature - Angular Implementation Guide

## 📦 Files Created

### 1. **Models** (`src/app/models/`)
- ✅ `promo-code.model.ts` - TypeScript interfaces for promo code requests/responses
- ✅ Updated `index.ts` - Added promo code exports and updated Cart/Order interfaces

### 2. **Service** (`src/app/core/services/`)
- ✅ `promo-code.service.ts` - Service for promo code API calls

### 3. **Component** (`src/app/shared/components/promo-code/`)
- ✅ `promo-code.component.ts` - Component logic with reactive forms
- ✅ `promo-code.component.html` - Template with Bootstrap 5 UI
- ✅ `promo-code.component.scss` - Component-specific styles

### 4. **Updated Files**
- ✅ `app.module.ts` - Added PromoCodeComponent to declarations
- ✅ `cart.component.ts` - Integrated promo code component
- ✅ `cart.component.html` - Added promo code UI and discount display
- ✅ `order-history.component.html` - Display promo code on orders
- ✅ `order-detail.component.html` - Show discount breakdown

---

## 🏗️ Architecture

```
CartComponent
    │
    ├─→ PromoCodeComponent
    │       ├─→ PromoCodeService
    │       │       └─→ HttpClient → Backend API
    │       └─→ CartService (refresh after apply/remove)
    │
    └─→ Cart Data (with discount information)
```

---

## 🔌 API Integration

### Backend Endpoints Used

#### 1. Apply Promo Code
```typescript
POST /api/promo-codes/apply
Headers: { Authorization: Bearer <JWT> }
Body: { code: "WELCOME10" }

Response:
{
  success: true,
  message: "Promo code applied successfully",
  code: "WELCOME10",
  discountAmount: 150.00
}
```

#### 2. Remove Promo Code
```typescript
DELETE /api/promo-codes/remove
Headers: { Authorization: Bearer <JWT> }

Response:
{
  success: true,
  message: "Promo code removed successfully"
}
```

#### 3. Get Cart (Updated)
```typescript
GET /api/cart
Headers: { Authorization: Bearer <JWT> }

Response:
{
  id: 1,
  entries: [...],
  subtotal: 1500.00,
  appliedPromoCode: "WELCOME10",
  discountAmount: 150.00,
  totalPrice: 1350.00,
  totalItems: 3
}
```

---

## 📋 Interface Updates

### Cart Interface
```typescript
export interface Cart {
  id: number;
  entries: CartEntry[];
  subtotal: number;              // ✨ NEW
  appliedPromoCode: string | null; // ✨ NEW
  discountAmount: number;         // ✨ NEW
  totalPrice: number;
  totalItems: number;
}
```

### Order Interface
```typescript
export interface Order {
  id: number;
  orderCode: string;
  status: string;
  subtotal: number;              // ✨ NEW
  appliedPromoCode: string | null; // ✨ NEW
  discountAmount: number;         // ✨ NEW
  totalPrice: number;
  paymentMethod: string;
  trackingNumber: string;
  placedDate: string;
  deliveryAddress: Address;
  entries: OrderEntry[];
}
```

---

## 🎨 UI Components

### PromoCodeComponent

**Inputs:**
- `appliedPromoCode` - Currently applied promo code (if any)
- `discountAmount` - Discount amount from applied code

**Outputs:**
- `promoCodeChanged` - Event emitted when code is applied or removed

**Features:**
- ✅ Reactive form with validation
- ✅ Alphanumeric validation (regex pattern)
- ✅ Max length 20 characters
- ✅ Trim spaces before API call
- ✅ Loading states (Apply/Remove buttons)
- ✅ Success/Error messages with auto-hide
- ✅ Bootstrap 5 responsive design
- ✅ Bootstrap Icons integration

### Cart Page Integration

**Order Summary displays:**
1. **Subtotal** - Cart total before discount
2. **Discount** (if applied) - Shows promo code and discount amount in green
3. **Shipping** - Free
4. **Total** - Final amount after discount

**Promo Code Section:**
- Shown in a separate card below order summary
- Input field appears when no code is applied
- Applied code display with "Remove" button when active

---

## 📝 Form Validation

### Reactive Form Validators

```typescript
promoForm = this.fb.group({
  code: ['', [
    Validators.maxLength(20),
    Validators.pattern(/^[a-zA-Z0-9]*$/) // Alphanumeric only
  ]]
});
```

### Validation Rules

| Rule | Implementation | Error Message |
|------|----------------|---------------|
| Empty field | Checked on submit | "Please enter a promo code" |
| Alphanumeric only | Regex pattern | "Promo code must contain only letters and numbers" |
| Max 20 chars | Validators.maxLength(20) | "Promo code must be 20 characters or less" |
| Trim spaces | Applied before API call | N/A |

---

## 🎯 User Flow

### Apply Promo Code Flow

1. User enters promo code in input field
2. Clicks "Apply" button
3. **Validation:**
   - Check if field is empty → Show error
   - Check form validity → Show validation errors
4. **API Call:**
   - Show loading spinner on button
   - Trim spaces from code
   - POST to `/api/promo-codes/apply`
5. **Handle Response:**
   - **Success:** Show success message, clear form, refresh cart
   - **Error:** Show backend error message
6. Cart updates with discount information

### Remove Promo Code Flow

1. User clicks "Remove" button
2. Show loading spinner
3. DELETE to `/api/promo-codes/remove`
4. **Handle Response:**
   - **Success:** Show success message, refresh cart
   - **Error:** Show error message
5. Cart updates without discount

### Cart Modification Behavior

When user adds, updates, or removes items:
- Cart is automatically updated by backend
- Applied promo code is **cleared by backend**
- User must re-apply promo code if cart was modified
- This ensures discount validation against new cart total

---

## 🚨 Error Handling

### Backend Error Messages (displayed as-is)

| Scenario | Backend Message |
|----------|----------------|
| Invalid code | "This promo code is not valid" |
| Already applied | "A promo code is already applied. Please remove it before applying a new one." |
| Minimum not met | "This code requires a minimum cart value of ₹X" |
| Generic error | "Failed to apply promo code. Please try again." |

### Error Display
- Alert message shown at top of promo code section
- Auto-hides after 5 seconds
- Dismissible with close button
- Color-coded (red for error, green for success)

---

## 🎨 Bootstrap 5 Styling

### Classes Used
- `alert` - Success/error messages
- `form-control` - Input field
- `input-group` - Input + button combination
- `btn-primary` - Apply button
- `btn-outline-danger` - Remove button
- `spinner-border` - Loading indicators
- `badge` - Promo code display
- `card` - Container sections
- `text-success` - Discount amount display

### Bootstrap Icons
- `bi-tag-fill` - Promo code icon
- `bi-check-circle` - Success icon
- `bi-exclamation-triangle-fill` - Error icon
- `bi-info-circle` - Info icon

---

## 🧪 Testing Scenarios

### Test Cases

1. ✅ **Apply valid promo code with sufficient cart value**
   - Enter: `FIRST15`
   - Expected: Success message, discount applied

2. ✅ **Apply invalid promo code**
   - Enter: `INVALID123`
   - Expected: "This promo code is not valid"

3. ✅ **Apply code with insufficient cart value**
   - Enter: `MEGA1000` (requires ₹5000)
   - Expected: "This code requires a minimum cart value of ₹5000.00"

4. ✅ **Try to apply second code**
   - Apply: `WELCOME10`
   - Try to apply: `SAVE20`
   - Expected: "A promo code is already applied..."

5. ✅ **Remove promo code**
   - Click "Remove"
   - Expected: Success message, discount removed

6. ✅ **Modify cart after applying code**
   - Apply code
   - Add/remove/update cart item
   - Expected: Code cleared automatically

7. ✅ **Validation errors**
   - Enter: `SPECIAL@CODE!`
   - Expected: Alphanumeric validation error

8. ✅ **Empty field submission**
   - Click Apply without entering code
   - Expected: "Please enter a promo code"

9. ✅ **Place order with discount**
   - Apply code
   - Complete checkout
   - Check order history
   - Expected: Discount shown on order

---

## 🔐 Security Features

1. **JWT Authentication Required**
   - All promo code endpoints require valid JWT
   - Handled by `AuthInterceptor`

2. **Backend Validation**
   - All validation done server-side
   - Frontend only for UX
   - Cannot bypass minimum order amounts

3. **Single Code Enforcement**
   - Backend ensures only one code per cart
   - Frontend reflects this in UI

---

## 📱 Responsive Design

### Mobile (< 576px)
- Input and button stack vertically
- Full-width buttons
- Applied code info stacks

### Tablet (576px - 991px)
- Input group stays horizontal
- Compact layout

### Desktop (> 992px)
- Full layout with sidebar
- Optimal spacing

---

## 🚀 Quick Start

### 1. Module Import (Already Done)
```typescript
// app.module.ts
import { PromoCodeComponent } from './shared/components/promo-code/promo-code.component';

declarations: [
  // ... other components
  PromoCodeComponent
]
```

### 2. Use in Template
```html
<app-promo-code 
  [appliedPromoCode]="cart.appliedPromoCode"
  [discountAmount]="cart.discountAmount"
  (promoCodeChanged)="onPromoCodeChanged()">
</app-promo-code>
```

### 3. Handle Event in Component
```typescript
onPromoCodeChanged() {
  // Reload cart to get updated discount info
  this.loadCart();
}
```

---

## 📊 Available Promo Codes (Seeded)

| Code | Type | Discount | Min Cart Value |
|------|------|----------|---------------|
| **FIRST15** | PERCENTAGE | 15% | None |
| **WELCOME10** | PERCENTAGE | 10% | ₹500 |
| **SAVE20** | PERCENTAGE | 20% | ₹1,000 |
| **FLAT500** | FIXED | ₹500 | ₹2,000 |
| **MEGA1000** | FIXED | ₹1,000 | ₹5,000 |

---

## ✅ Requirements Checklist

### Functional Requirements
- ✅ Promo code input field on cart page
- ✅ Apply button beside input
- ✅ Optional field (checkout works without code)
- ✅ Display applied promo code
- ✅ Remove link beside applied code

### Validation
- ✅ Alphanumeric characters only
- ✅ Max length 20 characters
- ✅ Trim spaces before API call
- ✅ Validation on Apply click
- ✅ Empty field validation

### Backend Integration
- ✅ Code existence validation
- ✅ Active status check
- ✅ One code per cart enforcement
- ✅ Minimum order amount validation

### Error Messages
- ✅ Invalid code message
- ✅ Already applied message
- ✅ Minimum amount message
- ✅ Display backend messages exactly

### Discount Types
- ✅ PERCENTAGE discount support
- ✅ FIXED discount support

### Cart Summary
- ✅ Refresh cart after apply
- ✅ Display discount as separate line
- ✅ Show discount in green
- ✅ Display revised total
- ✅ Remove functionality

### Order Persistence
- ✅ Store promo code on order
- ✅ Store discount amount on order
- ✅ Display in order history
- ✅ Display in order detail

### Technical Requirements
- ✅ Reactive Forms
- ✅ Validators implementation
- ✅ Regex validation
- ✅ Disable buttons during API calls
- ✅ Loading indicators
- ✅ Error handling
- ✅ Observable pattern
- ✅ Strong typing
- ✅ Bootstrap 5 styling
- ✅ Production-ready code

---

## 🎓 Code Comments

All components include:
- ✅ Class-level documentation
- ✅ Method-level comments
- ✅ Complex logic explanation
- ✅ Parameter descriptions
- ✅ Return value documentation

---

## 🔧 Environment Setup

Ensure `environment.ts` has:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

---

## 📞 Support

For issues or questions:
1. Check backend is running on port 8080
2. Verify JWT token is valid
3. Check browser console for errors
4. Review network tab for API responses

---

## 🎉 Feature Complete!

All requirements implemented and production-ready.
