# Order History & Reorder — Phase 1 Test Cases

**Epic:** Order History & Reorder (Phase 1)  
**Total Test Cases:** 10 (7 Happy Path + 3 Negative Path)

---

## CRITICAL (Priority 1)

### TC-001: View My Orders List with Order Details [Happy Path] [Critical]

**Story Reference:** Story 1 - View My Orders List  
**Preconditions:** User is authenticated and has at least 2 past orders  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login with valid credentials | User is logged in successfully |
| 2 | Navigate to Account > My Orders | My Orders page is displayed |
| 3 | Verify order list is displayed | List of all past orders is shown with most recent first |
| 4 | Verify each order row content | Each row displays: Order Reference Number, Order Date, Order Total, Order Status, Item Summary, and View button |
| 5 | Verify Item Summary for multi-item order | First product name is shown with "+N more" suffix (e.g., "Blue T-Shirt +2 more") |
| 6 | Click View button on an order | User is redirected to Order Details page |

---

### TC-002: View Order Details with Line Items and Delivery Address [Happy Path] [Critical]

**Story Reference:** Story 3 - View Order Details  
**Preconditions:** User is authenticated and has a past order with multiple items and a discount code applied  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Account > My Orders | My Orders list is displayed |
| 2 | Click on an order from the list | Order Details page loads successfully |
| 3 | Verify line items | Complete line items shown: product name, quantity, unit price per item |
| 4 | Verify delivery address | Delivery address snapshot from time of order placement is displayed (not current saved address) |
| 5 | Verify discount code | Applied discount/promo code is displayed along with discount amount/effect on total |
| 6 | Verify order total and status | Order total and order status are correctly displayed |
| 7 | Click 'Back to orders' button | User is navigated back to the Order List page |

---

### TC-003: Reorder All Available Items from Order Detail Page [Happy Path] [Critical]

**Story Reference:** Story 4 - Reorder from Order Detail Page  
**Preconditions:** User is authenticated and has a past order where all items are currently available in the catalog  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Account > My Orders | My Orders list is displayed |
| 2 | Click into a past order | Order Details page is displayed |
| 3 | Click "Reorder" button | Reorder action is triggered |
| 4 | Verify cart redirect | User is automatically redirected to the Cart page |
| 5 | Verify items added to cart | All products from the original order are added to the cart |
| 6 | Verify pricing | Items use current catalog price, not historical purchase price |
| 7 | Verify quantities | Quantities from the original order are preserved for each item |

---

### TC-004: Unauthenticated User Access to My Orders is Blocked [Negative Path] [Critical]

**Story Reference:** Story 6 - Restrict Order History & Reorder APIs to Authenticated Users  
**Preconditions:** User is not logged in (unauthenticated/guest)  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Attempt to navigate to My Orders page directly via URL | User is redirected to the login page |
| 2 | Attempt to access Order Details API with no auth token | API returns HTTP 401 Unauthorized with no order data in response body |
| 3 | Attempt to call Reorder API with no auth token | API returns HTTP 401 Unauthorized; no cart modification occurs |
| 4 | Login and then let session expire | Session token becomes invalid |
| 5 | Attempt to access My Orders with expired token | Request is treated as unauthenticated; user is redirected to login |

---

## HIGH (Priority 2)

### TC-005: Filter Orders by Status [Happy Path]

**Story Reference:** Story 2 - Filter Orders by Status  
**Preconditions:** User is authenticated and has orders in multiple statuses (Pending, Confirmed, Shipped, Delivered)  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Account > My Orders | My Orders page loads with "All" filter selected by default |
| 2 | Click on "Delivered" filter | Only orders with Delivered status are displayed; filter is visually highlighted |
| 3 | Click on "Pending" filter | Only orders with Pending status are displayed; no full page reload occurs |
| 4 | Click on "Shipped" filter | Only orders with Shipped status are displayed dynamically |
| 5 | Click on "All" filter | All orders are displayed again |

---

### TC-006: Reorder from Order List Page [Happy Path]

**Story Reference:** Story 7 - Reorder from Order List  
**Preconditions:** User is authenticated and has a past order with all items currently available  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Account > My Orders | My Orders list is displayed |
| 2 | Click "Reorder" button on an order row | Reorder action is triggered directly from the list |
| 3 | Verify redirect to Cart page | User is automatically redirected to the Cart page |
| 4 | Verify items in cart | All available products from the order are added with current catalog prices |
| 5 | Verify quantities preserved | Original order quantities are maintained for each item |

---

### TC-007: Reorder with Existing Items in Cart Merges Quantities [Happy Path]

**Story Reference:** Story 4 - Reorder from Order Detail Page  
**Preconditions:** User is authenticated, has a past order, and one of the order items already exists in the current cart  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add a product to cart that also exists in a past order | Item is in the cart with quantity 1 |
| 2 | Navigate to Account > My Orders | My Orders list is displayed |
| 3 | Click into the relevant past order | Order Details page is displayed |
| 4 | Click "Reorder" button | Reorder action is triggered |
| 5 | Verify cart after redirect | Existing item's quantity is merged/incremented (not duplicated as separate line) |
| 6 | Verify other items | Remaining items from the order are added as new cart lines |

---

### TC-008: Reorder Skips Unavailable Products and Notifies User [Negative Path]

**Story Reference:** Story 5 - Skip and Notify on Unavailable Products During Reorder  
**Preconditions:** User is authenticated and has a past order where some (not all) items are no longer available in the catalog  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Account > My Orders | My Orders list is displayed |
| 2 | Click into an order with partially unavailable items | Order Details page shows all original items (including removed products with historical data) |
| 3 | Click "Reorder" button | Reorder action processes available items only |
| 4 | Verify notification | Clear notification displayed: "One or more items were not added because they are no longer available" |
| 5 | Verify redirect to Cart page | User is redirected to Cart page; notification does not block navigation |
| 6 | Verify cart contents | Only currently available products are in the cart; unavailable items are skipped |

---

### TC-009: Reorder When ALL Products Are Unavailable [Negative Path]

**Story Reference:** Story 5 - Skip and Notify on Unavailable Products During Reorder  
**Preconditions:** User is authenticated and has a past order where ALL items have been removed from the catalog  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Account > My Orders | My Orders list is displayed |
| 2 | Click into an order where all items are unavailable | Order Details page displays historical product data correctly |
| 3 | Click "Reorder" button | Reorder action is triggered |
| 4 | Verify cart unchanged | Cart remains unchanged (no items added) |
| 5 | Verify notification | Notification clearly states "No items could be added" (not a silent redirect) |
| 6 | Verify no redirect to empty cart | User is not redirected to an empty/broken cart page |

---

### TC-010: Empty Order History Displays Appropriate Message [Happy Path]

**Story Reference:** Story 1 - View My Orders List  
**Preconditions:** User is authenticated and has zero past orders  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login with valid credentials (new account with no orders) | User is logged in successfully |
| 2 | Navigate to Account > My Orders | My Orders page loads |
| 3 | Verify empty state | Empty state message is displayed: "You haven't placed any orders yet" |
| 4 | Verify no blank/broken page | Page renders correctly with the message (no blank list or broken UI) |

---

## Test Case Summary

| Test Case ID | Type | Priority | Story Reference |
|--------------|------|----------|-----------------|
| TC-001 | Happy Path | Critical | Story 1 - View My Orders List |
| TC-002 | Happy Path | Critical | Story 3 - View Order Details |
| TC-003 | Happy Path | Critical | Story 4 - Reorder from Order Detail Page |
| TC-004 | Negative Path | Critical | Story 6 - Restrict APIs to Authenticated Users |
| TC-005 | Happy Path | High | Story 2 - Filter Orders by Status |
| TC-006 | Happy Path | High | Story 7 - Reorder from Order List |
| TC-007 | Happy Path | High | Story 4 - Reorder (Cart Merge) |
| TC-008 | Negative Path | High | Story 5 - Skip Unavailable Products |
| TC-009 | Negative Path | High | Story 5 - All Products Unavailable |
| TC-010 | Happy Path | High | Story 1 - Empty Order History |
