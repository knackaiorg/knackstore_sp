# Recently Viewed Products — Test Cases

**Source**: Recently Viewed User Stories (US-1 through US-4)
**Total Test Cases**: 4 (3 Happy Path | 1 Negative Path)

---

## Critical Priority (Top 4 — Automate First)

| Test ID | Scenario Description | Priority | Test Type | Linked US |
|:--------|:---------------------|:---------|:----------|:----------|
| TC-01 | Verify recently viewed products are saved to localStorage and displayed as a horizontal strip (up to 10 items) on Homepage and PDP | Critical | Positive (Happy) | US-1 |
| TC-02 | Verify logged-in user's recently viewed history persists across sessions and devices via server-side storage | Critical | Positive (Happy) | US-2 |
| TC-03 | Verify product card displays correct details (Image, Name, Price) and "Add to Cart" button works for non-variant products without page navigation | Critical | Positive (Happy) | US-3 |
| TC-04 | Verify viewing more than 10 products does not exceed the maximum limit and older items are evicted from localStorage | Critical | Negative | US-1 |

---

## Detailed Test Cases

### TC-01: Guest User — Recently Viewed Products Tracking & Display

- **Priority**: Critical
- **Type**: Positive (Happy Path)
- **User Story**: US-1
- **Preconditions**: User is browsing as a guest (not logged in); localStorage is empty
- **Steps**:
  1. Navigate to a Product Detail Page (PDP) for Product A.
  2. Verify Product A is saved to the browser's localStorage.
  3. Navigate to the Homepage.
  4. Observe the Recently Viewed section.
  5. Navigate to a PDP for Product B.
  6. Navigate back to the Homepage.
  7. Observe the Recently Viewed section again.
- **Expected Result**:
  - A horizontal strip displaying recently viewed products appears on the Homepage and PDP.
  - Products are displayed in reverse chronological order (most recent first).
  - Up to 10 products are shown in the strip.
  - Each viewed product is stored in the browser's localStorage.

---

### TC-02: Logged-In User — Cross-Session & Cross-Device Persistence

- **Priority**: Critical
- **Type**: Positive (Happy Path)
- **User Story**: US-2
- **Preconditions**: User has a registered account; user has previously viewed products while logged in
- **Steps**:
  1. Log into the account on Device/Browser A.
  2. Navigate to PDP for Product X, Product Y, and Product Z.
  3. Log out of the account.
  4. Log into the same account on a different Device/Browser B.
  5. Navigate to the Homepage.
  6. Observe the Recently Viewed section.
- **Expected Result**:
  - The recently viewed history (Product X, Y, Z) is fetched from the server-side database.
  - The same recently viewed products appear on Device/Browser B as were viewed on Device/Browser A.
  - Guest browsing history from before login is NOT merged into the logged-in user's history.

---

### TC-03: Product Card — Add to Cart for Non-Variant Product

- **Priority**: Critical
- **Type**: Positive (Happy Path)
- **User Story**: US-3
- **Preconditions**: User has recently viewed at least one product without variants (no size/color options)
- **Steps**:
  1. Navigate to a PDP for a non-variant product (e.g., a single-SKU item).
  2. Navigate to the Homepage to see the Recently Viewed strip.
  3. Verify the product card displays: Product Image, Product Name, and Price.
  4. Verify an "Add to Cart" button is visible on the card.
  5. Click the "Add to Cart" button on the recently viewed product card.
  6. Observe the page behavior and cart state.
- **Expected Result**:
  - The product card displays the primary image, product name, and price correctly.
  - The "Add to Cart" button is present for non-variant products.
  - Clicking "Add to Cart" adds the item to the cart without navigating away from the current page.
  - The cart icon/counter updates to reflect the newly added item.

---

### TC-04: Guest User — Maximum Limit Enforcement (Overflow Beyond 10 Products)

- **Priority**: Critical
- **Type**: Negative
- **User Story**: US-1
- **Preconditions**: User is browsing as a guest; localStorage is empty
- **Steps**:
  1. Navigate to PDPs for 11 different products sequentially (Product 1 through Product 11).
  2. After viewing all 11 products, navigate to the Homepage.
  3. Inspect the Recently Viewed section displayed on the page.
  4. Inspect the browser's localStorage for the recently viewed data.
- **Expected Result**:
  - Only 10 products are displayed in the Recently Viewed strip (Products 2–11).
  - Product 1 (the oldest viewed) is evicted from the list.
  - localStorage contains exactly 10 product entries, not 11.
  - The most recently viewed product (Product 11) appears in position 1 of the strip.
