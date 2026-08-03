# KnackStore App — Automation Test Plan

## Automation Suite Overview

This test plan describes the end-to-end automated test coverage for the **KnackStore** online storefront. It is written from a functional, business-facing point of view: every automated test is listed with the manual steps a tester would follow to execute the same scenario by hand. Every automated test is authored as an ordered sequence of narrated manual steps, so an execution report reads exactly like a manual test case run — each step is individually reported as passed or failed, which makes the automated results directly reviewable by manual testers, business analysts and product owners.

The suite validates the complete shopper journey across eight customer-facing features — from searching for a product, browsing a product detail page, applying a promo code, choosing a delivery option, placing an order, through to reviewing and reordering from order history. 



**Suite goals**

- Provide a fast **sanity** pass that confirms the critical shopper journeys are working after every build.
- Provide a broader **regression** pass that protects existing behaviour when new features are released.
- Keep every automated test traceable back to a documented manual test case and its originating user story.
- Cover both the expected behaviour and the failure/validation behaviour of each feature.

**Feature coverage**
| Feature | Spec | Data config | Tests |
| --- | --- | --- | --- |
| Checkout delivery options | [tests/checkout-delivery-options-test.spec.ts](tests/checkout-delivery-options-test.spec.ts) | `checkout-delivery-options-data.config.ts` | 10 |
| Order history & reorder | [tests/order-history-and-reorder-test.spec.ts](tests/order-history-and-reorder-test.spec.ts) | `order-history-and-reorder-data.config.ts` | 11 |
| PDP product Q&A | [tests/pdp-product-q&a-test.spec.ts](tests/pdp-product-q&a-test.spec.ts) | `pdp-product-q&a-recommendation-data.config.ts` | 7 |
| PDP product recommendations | [tests/pdp-product-recommendation-test.spec.ts](tests/pdp-product-recommendation-test.spec.ts) | `pdp-product-q&a-recommendation-data.config.ts` | 12 |
| PDP low-stock badge | [tests/pdp-stock-badge-test.spec.ts](tests/pdp-stock-badge-test.spec.ts) | `pdp-stock-badge-data.config.ts` | 10 |
| Promo code | [tests/promo-code-test.spec.ts](tests/promo-code-test.spec.ts) | `promo-code-data.config.ts` | 10 |
| Recently viewed products | [tests/recently-viewed-products-test.spec.ts](tests/recently-viewed-products-test.spec.ts) | `recently-viewed-products-data.config.ts` | 4 |
| Search autocomplete | [tests/search-auto-complete-test.spec.ts](tests/search-auto-complete-test.spec.ts) | `search-auto-complete-data.config.ts` | 4 |

**Total: 68 tests across 8 spec files.** Every test is written as a sequence of `test.step(...)` blocks so the HTML report reads like a manual test case, and each spec traces back to a markdown test case in [testcases/](testcases/) and a user story in [user-stories/](user-stories/).

**Total Validated Tests: Full sanity suite with 32 tests across 8 spec files.** In each feature, 3 critical positive test cases and 1 critical negative test case are automated and fully validated. The sanity suite is fully working with full parallel execution support. Remaining tests need to be properly validated before considering for sanity or regression suites.

**Tags in use:** `@sanity`, `@regression`, `@positive`, `@negative`, `@playwright`, `@setup`.

---

## Feature - Checkout Delivery Options

Covers the delivery-option step of checkout: the options offered, their fees, how they affect the order total, the free-delivery threshold, the estimated delivery dates, and the rule that a delivery option must be chosen before payment.

| Test Name | Manual Test Steps | Tags |
| --- | --- | --- |
| TC-01: Verify all three delivery options are displayed on the checkout page | 1. Log in to the application with valid credentials.<br>2. Navigate to the Delivery Options page in checkout.<br>3. Verify all three delivery options (Standard, 2-Day, Next-Day) are displayed.<br>4. Verify each delivery option shows its respective delivery fee. | `@sanity` `@regression` |
| TC-02: Verify delivery fee appears as a separate line item and total updates correctly | 1. Log in to the application with valid credentials.<br>2. Navigate to the Delivery Options page.<br>3. Select a delivery option.<br>4. Verify the delivery fee appears as a separate line item in the order summary.<br>5. Verify the order total updates correctly to include the delivery fee. | `@sanity` `@regression` |
| TC-03: Verify estimated delivery date updates based on selected option and excludes weekends | 1. Log in to the application with valid credentials.<br>2. Navigate to the Delivery Options page.<br>3. Select Standard delivery and note the fee and order total.<br>4. Switch to 2-Day delivery and verify the total updates accordingly.<br>5. Switch to Next-Day delivery and verify the total updates accordingly. | `@sanity` `@regression` |
| TC-04: Verify customer cannot proceed to payment without selecting a delivery option | 1. Log in to the application with valid credentials.<br>2. Navigate to the Delivery Options page.<br>3. Attempt to proceed to payment without selecting any delivery option.<br>4. Verify the system prevents navigation to the payment step. | `@sanity` `@regression` |
| TC-05: Verify Order Confirmation page displays delivery details | 1. Log in to the application with valid credentials.<br>2. Navigate to the Delivery Options page.<br>3. Select a delivery option and proceed through checkout.<br>4. Verify the Order Confirmation page displays the chosen delivery method, fee and estimated delivery date. | `@regression` |
| TC-06: Verify Order History page displays delivery details for past order | 1. Log in to the application with valid credentials.<br>2. Navigate to Order History.<br>3. Open a past order and verify the order details show the delivery information recorded at the time of purchase. | `@regression` |
| TC-07: Verify 2-Day Delivery cost becomes $0 when cart total exceeds $200 | 1. Log in to the application with valid credentials.<br>2. Add products to the cart so the cart total exceeds $200.<br>3. Navigate to the Delivery Options page.<br>4. Select the 2-Day Delivery option.<br>5. Verify the 2-Day Delivery fee is shown as $0 (Free). | `@regression` |
| TC-08: Verify customer can change delivery option and totals update accordingly | 1. Log in to the application with valid credentials.<br>2. Navigate to the Delivery Options page.<br>3. Select Standard delivery and note the fee and order total.<br>4. Change the selection to Next-Day delivery.<br>5. Verify the delivery fee and order total update to reflect the new selection. | `@regression` |
| TC-09: Verify 2-Day Delivery is NOT free when cart total is exactly $200 or below | 1. Log in to the application with valid credentials.<br>2. Add products to the cart so the cart total is at or below $200.<br>3. Navigate to the Delivery Options page.<br>4. Select the 2-Day Delivery option.<br>5. Verify the 2-Day Delivery fee is charged and is not $0. | `@regression` |
| TC-10: Verify estimated delivery date does not fall on weekend or holiday | 1. Log in to the application with valid credentials.<br>2. Navigate to the Delivery Options page.<br>3. Select Standard delivery and verify the estimated delivery date does not fall on a weekend.<br>4. Select 2-Day delivery and verify the estimated delivery date does not fall on a weekend.<br>5. Select Next-Day delivery and verify the estimated delivery date does not fall on a weekend. | `@regression` |

---

## Feature - Order History & Reorder

Covers the My Orders area: listing past orders, viewing order details, filtering by status, reordering items into the cart, handling unavailable products, access control for unauthenticated users, and the empty-history state.

> **Execution note:** the sanity scenarios (TC-000 to TC-004) run in sequence — TC-000 places a fresh order that the following sanity tests read. The regression scenarios (TC-005 to TC-010) are independent of one another.

| Test Name | Manual Test Steps | Tags |
| --- | --- | --- |
| TC-000: Place New Order and Verify Success Message | 1. Log in to the application with valid credentials.<br>2. Clear any existing items from the cart.<br>3. Add a product to the cart.<br>4. Open the cart and proceed to checkout.<br>5. Continue to the Delivery Options step.<br>6. Select a delivery option.<br>7. Continue to the Payment step.<br>8. Select a payment method and review the order.<br>9. Place the order.<br>10. Verify the order success message is displayed.<br>11. Verify an order reference number is generated. | `@sanity` `@setup` |
| TC-001: View My Orders List with Order Details | 1. Log in with valid credentials.<br>2. Navigate to Account > My Orders.<br>3. Verify the order list is displayed.<br>4. Verify each order row shows the expected content (order reference, date, status, total).<br>5. Verify the item summary is correct for a multi-item order.<br>6. Click the View button on an order and verify the order detail opens. | `@sanity` `@regression` |
| TC-002: View Order Details with Line Items and Delivery Address | 1. Log in and navigate to My Orders.<br>2. Verify the My Orders list is displayed.<br>3. Click an order from the list to open its details.<br>4. Verify the line items (product, quantity, price) are correct.<br>5. Verify the delivery address is displayed.<br>6. Verify the discount code applied to the order is displayed.<br>7. Verify the order total and order status are displayed.<br>8. Click the Back to orders button and verify the list is shown again. | `@sanity` `@regression` |
| TC-003: Reorder Available Items from Order Detail Page | 1. Log in and navigate to My Orders.<br>2. Verify the My Orders list is displayed.<br>3. Open a past order.<br>4. Click the Reorder button.<br>5. Verify the user is redirected to the Cart page.<br>6. Verify the items from the past order have been added to the cart. | `@sanity` `@regression` |
| TC-004: Unauthenticated User Access to My Orders is Blocked | 1. Without logging in, attempt to navigate directly to the My Orders page via its URL.<br>2. Verify the user is redirected to the login page and the order history is not exposed. | `@sanity` `@regression` |
| TC-005: Filter Orders by Status | 1. Log in and navigate to My Orders.<br>2. Verify the My Orders page loads with the All filter selected by default.<br>3. Select the Delivered filter and verify only delivered orders are listed.<br>4. Select the Pending filter and verify only pending orders are listed.<br>5. Select the Shipped filter and verify only shipped orders are listed.<br>6. Select the All filter again and verify all orders are listed. | `@regression` |
| TC-006: Reorder from Order List Page | 1. Log in and navigate to My Orders.<br>2. Verify the My Orders list is displayed.<br>3. Click the Reorder button directly on an order row.<br>4. Verify the user is redirected to the Cart page.<br>5. Verify the items from that order are present in the cart. | `@regression` |
| TC-007: Reorder with Existing Items in Cart Merges Quantities | 1. Log in to the application with valid credentials.<br>2. Navigate to Account > My Orders.<br>3. Verify the My Orders list is displayed.<br>4. Open the relevant past order.<br>5. Click the Reorder button.<br>6. Verify that after redirect the cart merges the reordered quantities with the items already in the cart instead of duplicating lines. | `@regression` |
| TC-008: Reorder Skips Unavailable Products and Notifies User | 1. Log in and navigate to My Orders.<br>2. Verify the My Orders list is displayed.<br>3. Open an order that contains partially unavailable items.<br>4. Click the Reorder button.<br>5. Verify a notification is displayed for the unavailable items.<br>6. Verify the user is redirected to the Cart page.<br>7. Verify only the available items were added to the cart. | `@regression` |
| TC-009: Reorder When ALL Products Are Unavailable | 1. Log in and navigate to My Orders.<br>2. Verify the My Orders list is displayed.<br>3. Open an order in which all items are unavailable.<br>4. Click the Reorder button.<br>5. Verify the cart remains unchanged.<br>6. Verify a notification explains that no items could be reordered. | `@regression` |
| TC-010: Empty Order History Displays Appropriate Message | 1. Log in with valid credentials using an account that has no orders.<br>2. Navigate to Account > My Orders.<br>3. Verify an appropriate empty-state message is displayed.<br>4. Verify the page renders correctly and is not blank or broken. | `@regression` |

---

## Feature - PDP Product Q&A

Covers the Customer Questions & Answers section on the product detail page: its placement and heading, the question submission form for logged-in shoppers, the character limit on questions, the restrictions applied to guest users, and the empty state when a product has no questions.

| Test Name | Manual Test Steps | Tags |
| --- | --- | --- |
| QA-001: Verify Q&A section is visible below the Reviews section on PDP | 1. Navigate to a product detail page.<br>2. Verify the Q&A section is visible.<br>3. Verify the Q&A section is positioned below the Reviews section. | `@sanity` `@regression` |
| QA-002: Verify Q&A section heading displays "Customer Questions & Answers" | 1. Navigate to a product detail page.<br>2. Verify the Q&A section heading text reads "Customer Questions & Answers". | `@sanity` `@regression` |
| QA-003: Verify text area and "Submit Question" button are visible for logged-in users | 1. Navigate to the home page.<br>2. Click the login button to open the login page.<br>3. Log in with valid credentials.<br>4. Navigate to a product detail page.<br>5. Verify the question text area is visible.<br>6. Verify the Submit Question button is visible. | `@sanity` `@regression` |
| QA-007: Verify character counter prevents input beyond 200 characters | 1. Navigate to the home page.<br>2. Click the login button and log in with valid credentials.<br>3. Navigate to a product detail page.<br>4. Verify the question text area enforces a 200-character maximum.<br>5. Enter text longer than the limit (201 characters).<br>6. Verify the text area retains only 200 characters.<br>7. Verify the character counter displays 200/200.<br>8. Verify the counted characters match the 200-character limit. | `@sanity` `@regression` `@negative` |
| QA-009: Verify guest user does NOT see "Post Question" or "Ask" action button | 1. Navigate to a product detail page as a guest user, without logging in.<br>2. Verify the Q&A section is visible.<br>3. Verify the "Ask a Question" card/form is not visible.<br>4. Verify the "Ask a Question" heading is not visible.<br>5. Verify the Submit Question button is not visible.<br>6. Verify the question text area is not visible. | `@regression` `@negative` |
| QA-010: Verify guest user sees login prompt or disabled state when attempting to post | 1. Navigate to a product detail page as a guest user.<br>2. Verify the Q&A section is visible.<br>3. Verify a login prompt message is displayed in place of the question form.<br>4. Verify the Submit Question button is either absent or disabled for guest users.<br>5. Verify the ask-question form cannot be accessed by a guest user. | `@regression` `@negative` |
| QA-011: Verify Q&A section renders correctly when no questions exist for the product | 1. Navigate to a product detail page for a product that has no questions.<br>2. Verify the Q&A section is visible.<br>3. Verify the Q&A section heading is displayed.<br>4. Verify an empty-state message is displayed.<br>5. Verify the empty-state message text is correct.<br>6. Verify a logged-in shopper can still submit a question from this state.<br>7. Verify the overall page structure remains intact with an empty Q&A section. | `@regression` `@negative` |

---

## Feature - PDP Product Recommendations

Covers the "Frequently Bought Together" section on the product detail page: its visibility and placement, the number and ordering of recommended products, exclusion rules (out-of-stock, discontinued, and the product being viewed), the content of each recommendation card, and availability to both guest and logged-in shoppers.

| Test Name | Manual Test Steps | Tags |
| --- | --- | --- |
| REC-001: Verify "Frequently Bought Together" section is visible on PDP | 1. Navigate to a product detail page.<br>2. Verify the Frequently Bought Together section is visible.<br>3. Verify the section heading text is correct. | `@sanity` `@regression` `@positive` |
| REC-002: Verify recommendation section is positioned below product description and near reviews | 1. Navigate to a product detail page.<br>2. Verify the recommendation section appears below the product description.<br>3. Verify the recommendation section appears near the reviews section. | `@regression` `@positive` |
| REC-003: Verify recommendation section displays exactly 2 products | 1. Navigate to a product detail page.<br>2. Verify the Frequently Bought Together section is visible.<br>3. Verify exactly 2 recommended products are displayed. | `@regression` `@positive` |
| REC-004: Verify top 2 products are displayed by co-purchase frequency | 1. Navigate to a product detail page.<br>2. Read the recommended product names in the order displayed.<br>3. Verify the two products shown are the top co-purchased products, in the expected order. | `@regression` |
| REC-005: Verify out-of-stock products are excluded from recommendations | 1. Navigate to a product detail page for a product whose co-purchased item is out of stock.<br>2. Read all recommended products.<br>3. Verify the out-of-stock product is not present in the recommendations. | `@regression` `@negative` |
| REC-006: Verify discontinued products are excluded from recommendations | 1. Navigate to a product detail page for a product whose co-purchased item is discontinued.<br>2. Read all recommended products.<br>3. Verify the discontinued product is not present in the recommendations. | `@regression` `@negative` |
| REC-007: Verify the viewed product itself does not appear in recommendations | 1. Navigate to a product detail page.<br>2. Note the name of the product currently being viewed.<br>3. Verify the current product does not appear in its own recommendations. | `@regression` `@negative` |
| REC-008: Verify recommended product cards from Frequently Bought Together section | 1. Navigate to the product detail page of the reference product.<br>2. Verify the Frequently Bought Together section is visible.<br>3. Read the recommended product names.<br>4. Verify the expected product appears in the recommendations.<br>5. Verify each product name matches the corresponding product card.<br>6. Verify each recommended product shows a valid vendor/brand. | `@sanity` `@regression` `@positive` |
| REC-009: Verify each frequently bought product contains "View Details" button | 1. Navigate to a product detail page.<br>2. Verify the Frequently Bought Together section is visible.<br>3. Verify each recommended product card has a "View Details" button.<br>4. Click the "View Details" button on the first recommended product and verify it is clickable and navigates as expected. | `@sanity` `@regression` |
| REC-010: Verify each recommended product card displays product image | 1. Navigate to a product detail page.<br>2. Verify every recommended product card displays an image.<br>3. Verify each image has a valid source.<br>4. Verify each image is loaded and rendered.<br>5. Verify every recommended product also displays a name, price and rating. | `@regression` `@positive` |
| REC-015: Verify recommendations are visible for guest users | 1. Navigate to a product detail page as a guest user, without logging in.<br>2. Verify the Frequently Bought Together section is visible.<br>3. Verify the recommended products are displayed. | `@regression` `@positive` |
| REC-016: Verify recommendations are visible for logged-in users | 1. Navigate to the home page.<br>2. Log in with valid credentials.<br>3. Navigate to a product detail page.<br>4. Verify the Frequently Bought Together section is visible.<br>5. Verify the recommended products are displayed. | `@sanity` `@regression` `@positive` |

---

## Feature - PDP Low-Stock Badge

Covers the stock availability badge on the product detail page: its visibility and quantity text, the visual state for sufficient / low / critical / zero stock, the effect on the Add to Cart button, and how the badge behaves when a shopper switches product variants or adds the item to the cart.

> **Pre-condition applied to every test in this feature:** log in with valid credentials, confirm the home page loads, and open the first product's detail page.

| Test Name | Manual Test Steps | Tags |
| --- | --- | --- |
| TC01: Stock badge is visible and displays quantity | 1. Log in and open a product detail page.<br>2. Verify the stock badge is visible on the page.<br>3. Verify the badge text contains the stock information. | `@sanity` `@regression` |
| TC02: Badge has warning state when stock is low (4 to 9) | 1. Log in and open a product detail page for an item with low stock.<br>2. Verify the stock badge is visible.<br>3. Verify the badge is styled with the low-stock warning appearance.<br>4. Verify the badge text matches the expected stock format. | `@sanity` `@regression` |
| TC03: Badge has danger state when stock is critical (1 to 3) | 1. Log in and open a product detail page for an item with critical stock.<br>2. Verify the stock badge is visible.<br>3. Verify the badge's critical-stock colour/appearance can be observed.<br>4. Verify the badge displays a numeric remaining quantity. | `@sanity` `@regression` |
| TC04: Out of Stock badge shown and Add to Cart hidden when quantity is 0 | 1. Log in and open a product detail page for an out-of-stock item.<br>2. Verify the stock badge area is visible.<br>3. Verify the stock badge text is present.<br>4. Verify the Add to Cart button visibility matches the stock state — hidden or unavailable when the product is out of stock. | `@sanity` `@regression` |
| TC05: Stock badge visible on product card | 1. Log in and open a product detail page.<br>2. Verify the stock badge is visible on the product card.<br>3. Verify the badge text contains the stock quantity. | `@regression` |
| TC06: Badge updates dynamically on variant switch | 1. Log in and open a product detail page.<br>2. Read the badge text for the default variant.<br>3. Switch to a different variant and verify the page does not reload.<br>4. Verify the badge text is present and refreshed after the variant switch. | `@regression` |
| TC07: Badge shows in-stock (green) state when quantity is above 10 | 1. Log in and open a product detail page for a well-stocked item.<br>2. Verify the stock badge is visible.<br>3. Verify the badge text shows the In Stock format.<br>4. Verify the badge uses the in-stock (green) appearance. | `@regression` |
| TC08: Badge does NOT show warning/danger state when stock is sufficient | 1. Log in and open a product detail page for a well-stocked item.<br>2. Verify the stock badge is visible.<br>3. Verify the badge does not display "Out of Stock".<br>4. Verify the badge displays In Stock text when the quantity is above 10. | `@regression` |
| TC09: Stock reservation — Add to Cart works and badge remains | 1. Log in and open a product detail page.<br>2. Verify the badge shows the stock level before adding to the cart.<br>3. Add the product to the cart.<br>4. Refresh the product detail page and verify the stock badge is still visible and correct. | `@regression` |
| TC10: Variant switch updates badge and Add to Cart remains functional | 1. In a fresh browser session, log in and navigate to a product detail page.<br>2. Verify the stock badge is visible in the new session.<br>3. Select a variant and verify the badge updates.<br>4. Verify the Add to Cart action still works after the variant switch. | `@regression` |

---

## Feature - Promo Code

Covers applying and removing promo codes in the cart: percentage discounts with and without a minimum cart value, restoring the total on removal, replacing one code with another, and the error handling for invalid codes, unmet minimums, stacking attempts and malformed input.

> **Pre-condition applied to every test in this feature:** log in with valid credentials, confirm the home page loads, open an in-stock product's detail page, add the product to the cart, open the Cart page, and clear any promo code left over from a previous run.

| Test Name | Manual Test Steps | Tags |
| --- | --- | --- |
| TC-01: Apply valid percentage promo code FIRST15 (no minimum) and verify discount | 1. Prepare the cart with a product and open the Cart page.<br>2. Verify the promo code input field and the Apply button are visible.<br>3. Enter promo code FIRST15 and apply it.<br>4. Verify the "Promo Code Applied:" confirmation text is displayed.<br>5. Verify the applied code text shows FIRST15.<br>6. Verify the discount line appears in the order summary.<br>7. Verify a Remove button appears next to the applied code. | `@sanity` `@regression` |
| TC-02: Apply valid percentage promo code SAVE20 (with minimum cart value) and verify discount | 1. Prepare the cart with a product and open the Cart page.<br>2. Enter promo code SAVE20 and apply it.<br>3. Verify the promo code is applied successfully.<br>4. Verify the applied code text shows SAVE20.<br>5. Verify both the discount line and the Remove button are visible. | `@sanity` `@regression` |
| TC-03: Remove applied promo code and verify cart total restores | 1. Prepare the cart with a product and open the Cart page.<br>2. Note the original order total before any promo is applied.<br>3. Apply promo code FIRST15.<br>4. Verify the promo code is applied successfully.<br>5. Click Remove to remove the promo code.<br>6. Verify the discount line is removed from the order summary.<br>7. Verify the promo code input field reappears.<br>8. Verify the order total is restored to the original amount. | `@sanity` `@regression` |
| TC-04: Apply promo code below the required minimum cart value — verify error | 1. Prepare the cart with a product whose total is below the code's minimum, and open the Cart page.<br>2. Apply promo code MEGA1000, which requires a higher minimum cart value.<br>3. Verify an error message explains that the minimum cart value has not been met.<br>4. Verify no discount is applied to the order summary.<br>5. Verify the promo code is not shown in an applied state. | `@regression` |
| TC-05: Apply second promo code when one is already applied — verify rejection | 1. Prepare the cart with a product and open the Cart page.<br>2. Apply the first promo code WELCOME10.<br>3. Verify the first promo code is applied.<br>4. Attempt to apply a second promo code SAVE20.<br>5. Verify an error message states that a promo code is already applied and the second code is rejected. | `@sanity` `@regression` |
| TC-06: Apply invalid/non-existent promo code — verify error message | 1. Prepare the cart with a product and open the Cart page.<br>2. Enter the invalid promo code INVALID123 and apply it.<br>3. Verify an error message for an invalid code is displayed.<br>4. Verify no discount is applied to the order summary. | `@regression` |
| TC-07: Verify promo code field and Apply button are displayed on cart page | 1. Prepare the cart with a product and open the Cart page.<br>2. Verify the promo code input field is visible.<br>3. Verify the Apply button is visible.<br>4. Verify the Order Summary section is visible.<br>5. Verify the Proceed to Checkout button is visible. | `@regression` |
| TC-08: Checkout without entering a promo code — verify checkout proceeds | 1. Prepare the cart with a product and open the Cart page.<br>2. Verify no promo code is applied initially.<br>3. Verify the Proceed to Checkout button is visible.<br>4. Click Proceed to Checkout without applying any promo code.<br>5. Verify the checkout page loads and the shopper has left the cart page. | `@regression` |
| TC-09: Remove applied promo code and apply a different valid promo code | 1. Prepare the cart with a product and open the Cart page.<br>2. Apply the first promo code FIRST15.<br>3. Verify the first promo code is applied.<br>4. Remove the applied promo code.<br>5. Verify the promo code has been removed.<br>6. Apply the second promo code SAVE20.<br>7. Verify the second promo code is applied successfully. | `@regression` |
| TC-10: Verify promo code with leading/trailing spaces is rejected as invalid | 1. Prepare the cart with a product and open the Cart page.<br>2. Enter a promo code containing leading and trailing spaces and apply it.<br>3. Verify an error message about alphanumeric-only characters is displayed.<br>4. Verify no discount is applied.<br>5. Verify the promo code is not shown in an applied state. | `@regression` |

---

## Feature - Recently Viewed Products

Covers the Recently Viewed strip: capturing viewed products, displaying them in reverse chronological order, persisting history across sessions for a logged-in shopper, the content and Add to Cart action on each card, and the maximum of 10 remembered products.

| Test Name | Manual Test Steps | Tags |
| --- | --- | --- |
| TC-01: Verify recently viewed products are saved and displayed as a horizontal strip | 1. Open the application and clear any previously stored browsing history.<br>2. Navigate to the product detail page for Product A.<br>3. Verify Product A is recorded in the recently viewed history.<br>4. Navigate to the Homepage and observe the Recently Viewed section.<br>5. Navigate to the product detail page for Product B.<br>6. Return to the Homepage and observe the Recently Viewed section again.<br>7. Verify the products are displayed in reverse chronological order (most recent first).<br>8. Verify the products remain stored in the browsing history.<br>9. Verify up to 10 products are shown in the strip. | `@sanity` `@regression` |
| TC-02: Verify logged-in user recently viewed history persists across sessions | 1. Log into the account.<br>2. Navigate to the product detail pages for Product X, Product Y and Product Z.<br>3. Note the viewed product names for later comparison.<br>4. Log out of the account.<br>5. Log back into the same account, simulating a new session.<br>6. Navigate to the Homepage and observe the Recently Viewed section.<br>7. Verify the recently viewed history from the previous session has persisted. | `@sanity` `@regression` |
| TC-03: Verify product card displays correct details and Add to Cart works for non-variant products | 1. Navigate to the product detail page for a non-variant product.<br>2. Navigate to the Homepage to see the Recently Viewed strip.<br>3. Verify the product card displays the product image.<br>4. Verify the product card displays the product name.<br>5. Verify the product card displays the price.<br>6. Verify the Add to Cart button is visible on the card and click it.<br>7. Verify the item is added to the cart without leaving the current page. | `@sanity` `@regression` |
| TC-04: Verify viewing more than 10 products does not exceed the maximum limit | 1. Open the application and clear any previously stored browsing history.<br>2. Navigate to the product detail pages of 11 different products one after another.<br>3. Navigate to the Homepage after viewing all 11 products.<br>4. Verify only 10 products are displayed in the Recently Viewed strip.<br>5. Verify exactly 10 products are retained in the stored history.<br>6. Verify the most recently viewed product appears in the first position.<br>7. Verify the oldest product (Product 1) has been dropped from the list. | `@sanity` `@regression` |

---

## Feature - Search Autocomplete

Covers the search suggestion dropdown: the minimum characters needed to trigger suggestions, navigation from a product suggestion straight to the product detail page, navigation from a category suggestion to the filtered product listing page, and the no-results state.

> **Pre-condition applied to every test in this feature:** launch the store and wait for the search box to be ready.

| Test Name | Manual Test Steps | Tags |
| --- | --- | --- |
| TC-01 (US-01): Typing exactly 2 characters with matching data displays the suggestion dropdown | 1. Launch the store and wait for the search box.<br>2. Type exactly 2 characters that match catalog data.<br>3. Verify the suggestion dropdown is displayed.<br>4. Verify at least one suggestion is listed. | `@sanity` `@regression` |
| TC-05 (US-03): Clicking a product suggestion navigates directly to the PDP, bypassing the search results page | 1. Launch the store and wait for the search box.<br>2. Search for a product term and wait for suggestions to appear.<br>3. Click the matching product suggestion.<br>4. Verify the shopper lands on the product detail page and the search results page is bypassed. | `@sanity` `@regression` |
| TC-06 (US-04): Clicking a category suggestion navigates to the PLP filtered to that category | 1. Launch the store and wait for the search box.<br>2. Search for a category term and wait for suggestions to appear.<br>3. Click the matching category suggestion.<br>4. Verify the shopper lands on the product listing page filtered to that category. | `@sanity` `@regression` |
| TC-12 (US-09): A zero-match query renders the dropdown with no products and a "no results found" message | 1. Launch the store and wait for the search box.<br>2. Type a term that matches no products, categories or brands.<br>3. Verify the dropdown shows the "no results found" message and lists no product suggestions. | `@sanity` `@regression` |
