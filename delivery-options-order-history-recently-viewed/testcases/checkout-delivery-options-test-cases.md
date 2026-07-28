# Delivery Option — Test Cases

**Source**: Delivery Option_User Stories.docx (US-1 through US-5)
**Total Test Cases**: 10 (7 Happy Path | 3 Negative Path)

---

## Critical Priority (Top 4 — Automate First)

| Test ID | Scenario Description | Priority | Test Type | Linked US |
|:--------|:---------------------|:---------|:----------|:----------|
| TC-01 | Verify all three delivery options (Standard, Express, 2-Day) are displayed on the checkout page | Critical | Positive (Happy) | US-1 |
| TC-02 | Verify delivery fee appears as a separate line item and total updates correctly when a delivery option is selected | Critical | Positive (Happy) | US-2 |
| TC-03 | Verify estimated delivery date updates correctly based on selected delivery option and excludes weekends | Critical | Positive (Happy) | US-3 |
| TC-04 | Verify the customer cannot proceed to payment without selecting a delivery option (mandatory selection validation) | Critical | Negative | US-1 |

---

## Remaining Happy Path Cases

| Test ID | Scenario Description | Priority | Test Type | Linked US |
|:--------|:---------------------|:---------|:----------|:----------|
| TC-05 | Verify Order Confirmation page displays the selected Delivery Option, Delivery Fee, and Estimated Delivery Date | High | Positive (Happy) | US-4 |
| TC-06 | Verify Order History page displays the Delivery Option, Delivery Fee, and Estimated Delivery Date for a past order | High | Positive (Happy) | US-4 |
| TC-07 | Verify 2-Day Delivery cost becomes $0 when cart total exceeds $200 (free delivery threshold) | High | Positive (Happy) | US-5 |
| TC-08 | Verify customer can successfully change delivery option selection before proceeding to payment and totals update accordingly | Medium | Positive (Happy) | US-1, US-2 |

---

## Remaining Negative Path Cases

| Test ID | Scenario Description | Priority | Test Type | Linked US |
|:--------|:---------------------|:---------|:----------|:----------|
| TC-09 | Verify 2-Day Delivery is NOT free when cart total is exactly $200 or below the threshold | High | Negative | US-5 |
| TC-10 | Verify estimated delivery date does not show a weekend or holiday date for any delivery option | Medium | Negative | US-3 |

---

## Detailed Test Cases

### TC-01: Display All Three Delivery Options

- **Priority**: Critical
- **Type**: Positive (Happy Path)
- **User Story**: US-1
- **Preconditions**: Customer has items in cart and navigates to checkout
- **Steps**:
  1. Add items to the cart.
  2. Proceed to the checkout page.
  3. Observe the delivery options section.
- **Expected Result**: Three delivery options (Standard, Express, 2-Day) are displayed with their respective fees.

---

### TC-02: Delivery Fee as Separate Line Item with Total Update

- **Priority**: Critical
- **Type**: Positive (Happy Path)
- **User Story**: US-2
- **Preconditions**: Customer is on the checkout page with items in cart
- **Steps**:
  1. Select a delivery option (e.g., Express).
  2. Observe the order summary section.
- **Expected Result**: Delivery fee appears as a separate line item. The order total updates to reflect the sum of item subtotal + delivery fee.

---

### TC-03: Estimated Delivery Date Updates and Excludes Weekends

- **Priority**: Critical
- **Type**: Positive (Happy Path)
- **User Story**: US-3
- **Preconditions**: Customer is on the checkout page
- **Steps**:
  1. Select Standard delivery and note the estimated delivery date.
  2. Switch to Express delivery and note the updated date.
  3. Switch to 2-Day delivery and note the updated date.
- **Expected Result**: Estimated delivery date updates per option. No delivery date falls on a weekend. Cutoff rules are applied correctly.

---

### TC-04: Mandatory Delivery Option Selection Before Payment

- **Priority**: Critical
- **Type**: Negative
- **User Story**: US-1
- **Preconditions**: Customer is on the checkout page with items in cart, no delivery option selected
- **Steps**:
  1. Do not select any delivery option.
  2. Attempt to proceed to payment.
- **Expected Result**: System prevents navigation to payment. A validation message is displayed indicating that a delivery option must be selected.

---

### TC-05: Order Confirmation Displays Delivery Details

- **Priority**: High
- **Type**: Positive (Happy Path)
- **User Story**: US-4
- **Preconditions**: Customer has completed checkout with a selected delivery option
- **Steps**:
  1. Complete purchase with a selected delivery option.
  2. View the Order Confirmation page.
- **Expected Result**: Order Confirmation displays the selected Delivery Option name, Delivery Fee, and Estimated Delivery Date.

---

### TC-06: Order History Displays Delivery Details

- **Priority**: High
- **Type**: Positive (Happy Path)
- **User Story**: US-4
- **Preconditions**: Customer has at least one completed order with delivery details
- **Steps**:
  1. Navigate to Order History.
  2. Open the details of a past order.
- **Expected Result**: Order History entry shows the Delivery Option, Delivery Fee, and Estimated Delivery Date.

---

### TC-07: Free 2-Day Delivery When Cart Exceeds $200

- **Priority**: High
- **Type**: Positive (Happy Path)
- **User Story**: US-5
- **Preconditions**: Customer has items in cart totaling more than $200 (e.g., $250)
- **Steps**:
  1. Add items to cart exceeding $200 total.
  2. Proceed to checkout.
  3. Select the 2-Day Delivery option.
- **Expected Result**: 2-Day Delivery fee shows $0.00. Order total does not include a delivery charge for 2-Day.

---

### TC-08: Change Delivery Option Before Payment

- **Priority**: Medium
- **Type**: Positive (Happy Path)
- **User Story**: US-1, US-2
- **Preconditions**: Customer is on checkout page with a delivery option already selected
- **Steps**:
  1. Select Standard delivery and note the fee and total.
  2. Change selection to Express delivery.
  3. Observe updated fee and total.
- **Expected Result**: Delivery fee and order total update to reflect the newly selected option. No stale values remain.

---

### TC-09: 2-Day Delivery NOT Free at Exactly $200 Threshold

- **Priority**: High
- **Type**: Negative
- **User Story**: US-5
- **Preconditions**: Customer has items in cart totaling exactly $200
- **Steps**:
  1. Add items to cart totaling exactly $200.
  2. Proceed to checkout.
  3. Select the 2-Day Delivery option.
- **Expected Result**: 2-Day Delivery fee is NOT $0. The standard delivery charge is applied since the cart does not exceed the $200 threshold.

---

### TC-10: Delivery Date Must Not Fall on Weekend or Holiday

- **Priority**: Medium
- **Type**: Negative
- **User Story**: US-3
- **Preconditions**: Customer is on checkout page; test is run on a day where naive date calculation would result in a weekend delivery
- **Steps**:
  1. Select each delivery option one by one.
  2. Note the estimated delivery date for each.
- **Expected Result**: No estimated delivery date falls on a Saturday, Sunday, or configured holiday.

---

## Test Data Requirements

| Requirement | Detail |
|:------------|:-------|
| User Account | Registered customer with valid shipping address |
| Cart < $200 | Products totaling under $200 for general tests |
| Cart = $200 | Products totaling exactly $200 for TC-09 boundary test |
| Cart > $200 | Products totaling over $200 for TC-07 free delivery test |
| Historical Order | At least one completed order with delivery data for TC-06 |
| Threshold Config | Free delivery threshold set to $200 in test environment |
