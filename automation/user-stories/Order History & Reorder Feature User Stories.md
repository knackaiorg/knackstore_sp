# **Order History & Reorder — Phase 1 JIRA User Stories**

**Epic:** Order History & Reorder (Phase 1\) **Roles:** Authenticated Customer, System

---

## **STORY 1: View My Orders List**

**As an** authenticated customer **I want to** see a list of my past orders in the My Orders tab **So that** I can quickly review my purchase history

**Estimated Effort:** Medium

### **Acceptance Criteria**

**Happy Path**

* Given I am logged in, when I navigate to Account \> My Orders, then I see a list of all my past orders.  
* Each order row displays: Order Reference Number, Order Date, Order Total, Order Status,Item Summary and view button when clicked redirects to order details page.  
* Item Summary shows the first product's name; if the order has more than one item, it appends "+N more" (e.g., "Blue T-Shirt \+2 more").  
* Orders are displayed with the most recent order first.

**Validation / Edge Cases**

* If the customer has zero orders, an empty state message is displayed instead of a blank list (e.g., "You haven't placed any orders yet").  
* An order with exactly one item displays only the product name, with no "+N more" suffix.  
* Order Total is displayed in the correct currency format matching the store locale.

**Error Handling**

* If the order data fails to load (e.g., API/service error), display a friendly error message (e.g., “Unable to retrieve the date. Please try again later”) with a retry option instead of a blank/broken page.

**Permissions**

* Only orders belonging to the logged-in customer are shown; no other customer's orders are visible or retrievable.  
* Unauthenticated users attempting to access My Orders are redirected to login.

**Note** \- All the error messages (if any) are displayed on the red banner and All the successful messages (if any) are displayed on the green banner.

---

## **STORY 2: Filter Orders by Status**

**As an** authenticated customer **I want to** filter my order list by status **So that** I can quickly find orders in a specific state

**Estimated Effort:** Small

### **Acceptance Criteria**

**Happy Path**

* Given I am on the My Orders page, when I select a filter (All, Pending, Confirmed, Shipped, Delivered), then only orders matching that status are displayed.  
* "All" is the default selected filter on page load.

**Validation / Edge Cases**

* If no orders exist for a selected status, an empty state message is shown (e.g., "No orders found").  
* Filter selection persists visually (selected filter is clearly highlighted) until changed.  
* Filtering does not trigger a full page reload (list updates dynamically where applicable).

**Error Handling**

* If the filtered data request fails, display an error message with a retry option (e.g., “Unable to retrieve the date. Please try again later”); the previously loaded list should not disappear or corrupt.

**Permissions**

* Filtering only operates on the logged-in customer's own orders.

**Note** \- All the error messages (if any) are displayed on the red banner and All the successful messages (if any) are displayed on the green banner.

**STORY 3: View Order Details**

**As an** authenticated customer **I want to** view the full details of a specific order **So that** I can review everything I purchased, what it cost, and where it was delivered

**Estimated Effort:** Medium

### **Acceptance Criteria**

**Happy Path**

* Given I click into an order from the list, when the Order Details page loads, then I see: complete line items (product name, quantity, unit price per item), delivery address snapshot, applied discount code (if any), order total, and order status.  
* The delivery address shown is the snapshot captured at the time of order placement, not the customer's current saved address.  
* If a discount/promo code was applied at purchase, it is displayed along with the discount amount/effect on the total.  
* ‘Back to orders’ button is displayed and on click, the user is taken back to the ‘Order list’ page.

**Validation / Edge Cases**

* If no discount code was applied, the discount code section  clearly shows "No promo code applied" (not left blank/ambiguous).  
* Orders containing a product that has since been removed from the catalog still display that product's name, quantity, and historical unit price correctly on the details page (view-only; removal only affects reorder, not history display).

**Error Handling**

* If the order ID in the URL/request does not belong to the logged-in customer, return a 403/404 (not the order details) — no data leakage to other customers.  
* If the order details fail to load, show an error state with a retry option.(e.g., “Unable to retrieve the date. Please try again later”)

**Permissions**

* Only the customer who placed the order can view its details.  
* Unauthenticated requests to the order details API return HTTP 401 Unauthorized.

**Note** \- All the error messages (if any) are displayed on the red banner and All the successful messages (if any) are displayed on the green banner.

**STORY 4: Reorder from Order Detail Page**

**As an** authenticated customer **I want to** click "Reorder" from  order's detail page **So that** I can quickly repurchase items from a past order without searching for each product

**Estimated Effort:** Large

### **Acceptance Criteria**

**Happy Path**

* Given a past order, when I click "Reorder", then all currently available products from that order are added to my current shopping cart.  
* Added items use the current catalog price, not the historical purchase price paid in the original order.  
* Quantities from the original order are preserved for each available item.  
* After a successful reorder, I am automatically redirected to the Cart page.

**Validation / Edge Cases**

* If a product's available stock is less than the originally ordered quantity, the system adds the maximum currently permitted quantity per existing cart/stock rules (aligned with standard add-to-cart behavior).  
* If an item from the order already exists in the customer's current cart, quantities are merged/incremented rather than duplicated as a separate line, consistent with standard cart behavior.  
* Reordering an order where all items are still available adds every item with no notification about unavailability.

**Error Handling**

* If the reorder action fails entirely (e.g., system/service error), the customer sees an error message and is not redirected to an empty or broken cart.  
* If the cart service is unavailable, no partial/inconsistent cart state is created; the customer is informed to retry.

**Permissions**

* A customer can only reorder from their own past orders; the Reorder action/API must validate order ownership.  
* Unauthenticated users cannot trigger reorder; the API returns HTTP 401 Unauthorized.

**Note** \- All the error messages (if any) are displayed on the red banner and All the successful messages (if any) are displayed on the green banner.

## **STORY 5: Skip and Notify on Unavailable Products During Reorder**

**As an** authenticated customer **I want to** be informed when some items from my past order can't be reordered **So that** I understand exactly what was added to my cart and what was skipped

**Estimated Effort:** Medium

### **Acceptance Criteria**

**Happy Path**

* Given a past order contains one or more products no longer available in the catalog, when I click Reorder, then those unavailable products are skipped and all remaining available products are added to the cart.  
* A clear notification is displayed informing me that “One or more items were not added because they are no longer available” (message should be visible before or immediately upon arrival at the Cart page).

**Validation / Edge Cases**

* If ALL products in the order are unavailable, the cart remains unchanged, and the notification clearly states that “no items could be added” (rather than silently redirecting with no context).  
* The notification does not block or require dismissal before the customer can continue shopping/viewing the cart.  
* Notification content does not falsely imply items were added when none were.

**Error Handling**

* If the availability check itself fails (service error), the reorder is not partially processed silently — the customer is shown an error rather than an incomplete cart with no explanation.

**Permissions**

* Availability check applies uniformly regardless of user; no role-based exceptions in Phase 1\.

**Note** \- All the error messages (if any) are displayed on the red banner and All the successful messages (if any) are displayed on the green banner.

**STORY 6: Restrict Order History & Reorder APIs to Authenticated Users**

**As a** system **I want to** enforce authentication on all Order History and Reorder endpoints **So that** customer order data and reorder actions are protected from unauthorized access

**Estimated Effort:** Small

### **Acceptance Criteria**

**Happy Path**

* Given a valid authenticated session/token, when a customer calls any Order History or Reorder API (list, details, reorder), then the request is processed normally and returns only that customer's data.

**Validation / Edge Cases**

* A customer cannot access another customer's order data by manipulating an order ID/reference in the request (ownership is validated server-side, not just via UI).  
* Expired or invalid session tokens are treated the same as unauthenticated requests.

**Error Handling**

* Any unauthenticated request to Order List, Order Details, or Reorder APIs returns HTTP 401 Unauthorized with no order data leaked in the response body.  
* Attempting to access another customer's order (authenticated but not the owner) returns HTTP 403 Forbidden or 404 Not Found, not the order data.

**Permissions**

* Guest/unauthenticated users have no access to any Order History or Reorder functionality (UI should redirect to login; API must independently enforce this regardless of UI behavior).

**Note** \- All the error messages (if any) are displayed on the red banner and All the successful messages (if any) are displayed on the green banner.

---

## **STORY 7: Reorder from Order List**

**As an** authenticated customer **I want to** click "Reorder" from either the order list page **So that** I can quickly repurchase items from a past order without searching for each product

**Estimated Effort:** Large

### **Acceptance Criteria**

**Happy Path**

* Given a past order, when I click "Reorder", then all currently available products from that order are added to my current shopping cart.  
* Added items use the current catalog price, not the historical purchase price paid in the original order.  
* Quantities from the original order are preserved for each available item.  
* After a successful reorder, I am automatically redirected to the Cart page.

**Validation / Edge Cases**

* If a product's available stock is less than the originally ordered quantity, the system adds the maximum currently permitted quantity per existing cart/stock rules (aligned with standard add-to-cart behavior).  
* If an item from the order already exists in the customer's current cart, quantities are merged/incremented rather than duplicated as a separate line, consistent with standard cart behavior.  
* Reordering an order where all items are still available adds every item with no notification about unavailability.

**Error Handling**

* If the reorder action fails entirely (e.g., system/service error), the customer sees an error message and is not redirected to an empty or broken cart.  
* If the cart service is unavailable, no partial/inconsistent cart state is created; the customer is informed to retry.

**Permissions**

* A customer can only reorder from their own past orders; the Reorder action/API must validate order ownership.  
* Unauthenticated users cannot trigger reorder; the API returns HTTP 401 Unauthorized.

**Note** \- All the error messages (if any) are displayed on the red banner and All the successful messages (if any) are displayed on the green banner.

