# Promo Code Feature - Quick Testing Guide

## 🚀 Start Applications

### 1. Start Backend
```bash
cd backend
./mvnw spring-boot:run
```
Backend runs on: `http://localhost:8080`

### 2. Start Frontend
```bash
cd frontend
npm start
```
Frontend runs on: `http://localhost:4200`

---

## 🔑 Test Credentials

**Demo Account:**
- Email: `demo@knack.com`
- Password: `Demo@1234`

---

## 🧪 Test Scenarios

### Scenario 1: Apply Valid Promo Code (No Minimum)

1. Login with demo credentials
2. Add products to cart (any amount)
3. Go to Cart page
4. Enter promo code: `FIRST15`
5. Click **Apply**

**Expected Result:**
- ✅ Success message: "Promo code applied successfully"
- ✅ Badge shows: `FIRST15`
- ✅ Discount line appears in Order Summary (green text)
- ✅ Discount: 15% of subtotal
- ✅ Total is reduced
- ✅ Input field is hidden
- ✅ "Remove" button appears

---

### Scenario 2: Apply Code With Minimum Requirement (Met)

1. Add products worth ₹1000 or more
2. Enter promo code: `SAVE20`
3. Click **Apply**

**Expected Result:**
- ✅ Success message
- ✅ 20% discount applied
- ✅ Discount shown in cart summary

---

### Scenario 3: Apply Code With Minimum Requirement (Not Met)

1. Add products worth less than ₹2000
2. Enter promo code: `FLAT500`
3. Click **Apply**

**Expected Result:**
- ❌ Error message: "This code requires a minimum cart value of ₹2000.00"
- ❌ No discount applied
- ❌ Code not saved to cart

---

### Scenario 4: Apply Invalid Code

1. Enter promo code: `INVALID123`
2. Click **Apply**

**Expected Result:**
- ❌ Error message: "This promo code is not valid"
- ❌ No discount applied

---

### Scenario 5: Try to Apply Second Code

1. Apply first code: `WELCOME10`
2. Try to apply second code: `SAVE20`
3. Click **Apply**

**Expected Result:**
- ❌ Error message: "A promo code is already applied. Please remove it before applying a new one."
- ❌ First code remains applied

---

### Scenario 6: Remove Promo Code

1. Apply any valid code
2. Click **Remove** button
3. Wait for API response

**Expected Result:**
- ✅ Success message: "Promo code removed successfully"
- ✅ Badge disappears
- ✅ Discount line removed from Order Summary
- ✅ Total price restored to subtotal
- ✅ Input field appears again
- ✅ Can apply new code

---

### Scenario 7: Validation - Empty Field

1. Leave promo code field empty
2. Click **Apply**

**Expected Result:**
- ❌ Error message: "Please enter a promo code"
- ❌ No API call made

---

### Scenario 8: Validation - Special Characters

1. Enter: `SPECIAL@CODE!`
2. Tab out of field or click Apply

**Expected Result:**
- ❌ Validation error below field: "Promo code must contain only letters and numbers"
- ❌ Red border on input field
- ❌ Apply button should still work but will show validation error

---

### Scenario 9: Validation - Too Long

1. Enter: `THISISAVERYLONGPROMOCODE123`
2. Field should stop at 20 characters

**Expected Result:**
- ⚠️ Field accepts only first 20 characters
- ⚠️ Validation message if length exceeded

---

### Scenario 10: Cart Modification Clears Code

1. Apply valid promo code (e.g., `FIRST15`)
2. Confirm discount is applied
3. Add a new product to cart OR update quantity

**Expected Result:**
- ✅ Cart updates with new items/quantity
- ❌ Promo code is cleared by backend
- ❌ Discount removed
- ℹ️ Input field reappears (no code applied)
- ℹ️ User must re-apply code if desired

---

### Scenario 11: Complete Checkout With Discount

1. Apply valid promo code
2. Click **Proceed to Checkout**
3. Fill delivery address
4. Select payment method
5. Place order
6. Go to **Order History**
7. View order details

**Expected Result:**
- ✅ Order shows promo code in order history list
- ✅ Order detail shows:
  - Subtotal (original amount)
  - Discount line with promo code name
  - Total (after discount)
- ✅ Discount saved permanently on order

---

### Scenario 12: Loading States

1. Enter valid code
2. Click Apply
3. Observe button during API call

**Expected Result:**
- ⏳ Button text changes to "Applying..."
- ⏳ Spinner icon appears
- ⏳ Button is disabled
- ⏳ After response, button returns to normal

---

### Scenario 13: Success Message Auto-Hide

1. Apply valid code
2. Wait 5 seconds

**Expected Result:**
- ✅ Success message appears
- ⏱️ After 5 seconds, message auto-hides

---

### Scenario 14: Error Message Manual Dismiss

1. Apply invalid code
2. Click X button on error message

**Expected Result:**
- ❌ Error message appears
- ✅ Clicking X closes the message immediately

---

## 📋 Available Promo Codes

### Test with these pre-seeded codes:

| Code | Type | Discount | Minimum Cart | Use Case |
|------|------|----------|--------------|----------|
| **FIRST15** | Percentage | 15% | None | Best for testing - no minimum |
| **WELCOME10** | Percentage | 10% | ₹500 | Test minimum validation |
| **SAVE20** | Percentage | 20% | ₹1,000 | Test higher percentage |
| **FLAT500** | Fixed | ₹500 | ₹2,000 | Test fixed discount |
| **MEGA1000** | Fixed | ₹1,000 | ₹5,000 | Test high minimum requirement |

---

## 🎯 Quick Test Checklist

- [ ] Login successful
- [ ] Promo code input field visible
- [ ] Apply button works
- [ ] Loading spinner shows during API call
- [ ] Success message displays
- [ ] Error messages display correctly
- [ ] Discount line appears in green
- [ ] Badge shows applied code
- [ ] Remove button works
- [ ] Cart refreshes after apply/remove
- [ ] Validation errors show for invalid input
- [ ] Empty field validation works
- [ ] Second code application blocked
- [ ] Cart modification clears code
- [ ] Order shows discount in history
- [ ] Order detail shows discount breakdown
- [ ] Mobile responsive design works
- [ ] All currency displays show ₹ symbol

---

## 🔍 Debugging Tips

### If promo code doesn't apply:

1. **Check Backend Logs:**
   ```bash
   # In backend terminal, look for errors
   ```

2. **Check Browser Console:**
   - F12 → Console tab
   - Look for JavaScript errors

3. **Check Network Tab:**
   - F12 → Network tab
   - Look for `/api/promo-codes/apply` request
   - Check request payload and response

4. **Verify Cart Has Items:**
   - Promo codes can't be applied to empty cart

5. **Check Minimum Requirements:**
   - Ensure cart total meets minimum (if required)

### If discount doesn't show:

1. **Refresh Cart:**
   - Cart should auto-refresh after applying code
   - Try manual page refresh

2. **Check Response:**
   - Verify API returns `discountAmount`

3. **Check Cart Model:**
   - Ensure `appliedPromoCode` and `discountAmount` are in Cart interface

---

## 🌐 API Endpoints for Manual Testing

### Using Postman/curl:

#### 1. Login
```bash
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "demo@knack.com",
  "password": "Demo@1234"
}

Response: { "token": "eyJhbGci..." }
```

#### 2. Get Cart
```bash
GET http://localhost:8080/api/cart
Authorization: Bearer <token>
```

#### 3. Apply Promo Code
```bash
POST http://localhost:8080/api/promo-codes/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "FIRST15"
}
```

#### 4. Remove Promo Code
```bash
DELETE http://localhost:8080/api/promo-codes/remove
Authorization: Bearer <token>
```

---

## 📸 Visual Checks

### Cart Page Should Show:

✅ **Order Summary Card:**
- Subtotal line
- Discount line (if code applied) in green
- Shipping line
- Total line (bold, larger)

✅ **Promo Code Card:**
- Either input field + Apply button
- Or applied code badge + Remove button

✅ **When Code Applied:**
- Green badge with code name
- "You saved ₹X with this code!" message
- Green discount line in summary

✅ **Checkout Button:**
- Always visible
- Works with or without promo code

---

## ✅ Final Verification

After all tests, verify:

1. [ ] All 5 promo codes work correctly
2. [ ] Validation prevents invalid input
3. [ ] Backend error messages display properly
4. [ ] Cart updates reflect discount immediately
5. [ ] Orders persist discount information
6. [ ] Order history shows promo codes
7. [ ] Mobile layout is responsive
8. [ ] No console errors
9. [ ] Loading states work properly
10. [ ] Can complete full checkout with discount

---

## 🎉 Testing Complete!

If all scenarios pass, the promo code feature is working correctly and ready for production!
