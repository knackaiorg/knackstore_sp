# Automation Scoping & Test Plan Matrix — Promo Code Feature (Phase 1)

---

## User Story

**As a** customer,  
**I want to** enter a promo code on the cart page  
**So that** I can receive a discount before checkout.

---

## Acceptance Criteria Summary

1. A text field and Apply button are displayed prominently near the Order Summary.
2. Field accepts alphanumeric codes up to 20 characters; field is optional.
3. Code is validated against the promo code table (exists, active, within dates, minimum order met).
4. Two discount types supported: PERCENTAGE and FIXED.
5. Only one promo code per cart — must remove before applying another.
6. Discount shown as a labelled negative line item; revised total displayed immediately.
7. Remove link allows removing applied promo; cart total restores.
8. Login required; guest checkout out of scope.

---

## Technical Context & Constraints

- **Application Type**: Web UI (Angular 17 + Bootstrap 5)
- **Known Automation Blockers**: None identified for Phase 1 scope
- **APIs**: POST `/cart/promocode/apply`, POST `/cart/promocode/remove`
- **Pre-seeded Data**: Promo codes loaded via data loader (no admin UI this sprint)

---

## Section 1: Automation Scoping Matrix (10 Test Cases)

### Critical Priority (Top 4 — Execute First)

| #   | Test ID   | Scenario Description                                                                                     | Priority | Automation Scoped | Test Type | Automation Feasibility Reason                                                                                                |
| :-- | :-------- | :------------------------------------------------------------------------------------------------------- | :------- | :---------------- | :-------- | :--------------------------------------------------------------------------------------------------------------------------- |
| 1   | TC-PC-001 | Apply a valid percentage promo code (FIRST15, no minimum) and verify discount reflected in order summary | Critical | YES               | Positive  | Core happy path — validates end-to-end apply flow with PERCENTAGE type. High ROI, deterministic.                             |
| 2   | TC-PC-002 | Apply a valid fixed amount promo code (FLAT500) when minimum cart value ₹2000 is met                     | Critical | YES               | Positive  | Core happy path — validates FIXED discount type with minimum order check. Deterministic, data-driven.                        |
| 3   | TC-PC-003 | Remove an applied promo code and verify cart total restores to original                                  | Critical | YES               | Positive  | Critical remove flow — validates API call, cart refresh, and total recalculation. Fully automatable.                         |
| 4   | TC-PC-004 | Apply a promo code when cart subtotal is below the minimum order amount                                  | Critical | YES               | Negative  | Critical guard — validates "This code requires a minimum cart value of ₹X." error. Deterministic assertion on error message. |
| 5   | TC-PC-005 | Apply second promo code (SAVE20) when WELCOME10 is already applied — verify rejection                    | Critical | YES               | Negative  | Testing Guide Scenario 5 — validates one-code-per-cart rule. Error: "A promo code is already applied."                       |
| 6   | TC-PC-006 | Enter invalid/non-existent promo code (INVALID123) and verify error message                              | Critical | YES               | Negative  | Testing Guide Scenario 4 — validates backend rejection. Error: "This promo code is not valid."                               |

### High / Medium Priority (Remaining 4)

| #   | Test ID   | Scenario Description                                                           | Priority | Automation Scoped | Test Type | Automation Feasibility Reason                                                                   |
| :-- | :-------- | :----------------------------------------------------------------------------- | :------- | :---------------- | :-------- | :---------------------------------------------------------------------------------------------- |
| 7   | TC-PC-007 | Verify promo code field and Apply button are displayed on the cart page        | High     | YES               | Positive  | UI presence check — validates element visibility near order summary. Simple locator assertion.  |
| 8   | TC-PC-008 | Checkout without entering a promo code — verify checkout proceeds successfully | Medium   | YES               | Positive  | Validates optional field behavior. Checkout flow proceeds without promo entry.                  |
| 9   | TC-PC-009 | Remove applied promo code and apply a different valid promo code               | Medium   | YES               | Positive  | Validates replace flow — remove then re-apply. Combines remove + apply assertions.              |
| 10  | TC-PC-010 | Verify leading/trailing spaces are trimmed before promo code validation        | Medium   | YES               | Positive  | Validates trim behavior — enter code with spaces, verify successful application after trimming. |

---

## Section 2: Automation Execution Strategy

### High-Value Targets (Automate First)

1. **TC-PC-001 — Apply valid percentage promo code**: Validates the primary user journey (enter code → apply → see discount). Covers PERCENTAGE type, API integration, and cart summary update.
2. **TC-PC-002 — Apply valid fixed promo code with minimum order check**: Validates FIXED type + minimum order enforcement in a single flow. High business-rule coverage.
3. **TC-PC-003 — Remove promo code**: Validates the remove API, cart refresh, and total restoration — critical for user experience and one-code-per-cart rule.

### Manual / Out-of-Scope Rationale

| Scenario                                             | Reason for Exclusion                                                                                                               |
| :--------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| Visual green color of discount line (TC-064 in XLSX) | CSS/color verification is brittle in automation; better validated via visual regression tools or manual review.                    |
| Finance reconciliation report (TC-079, TC-091)       | Requires database/reporting system access outside the Angular UI scope. Backend integration test, not UI automation.               |
| Order history discount persistence (TC-090)          | Cross-session verification requiring order placement + re-login + history navigation — complex E2E that can be a Phase 2 addition. |
| Admin code management                                | Explicitly out of scope this sprint (codes are pre-seeded via data loader).                                                        |

### Prerequisites & Test Data Requirements

| #   | Requirement                                 | Details                                                                                         |
| :-- | :------------------------------------------ | :---------------------------------------------------------------------------------------------- |
| 1   | Valid logged-in user                        | Credentials: `demo@knack.com` / `Demo@1234`                                                     |
| 2   | Cart with items                             | At least one product added to cart before promo code tests                                      |
| 3   | Pre-seeded promo codes (from Testing Guide) | `FIRST15` — PERCENTAGE, 15% discount, no minimum (best for testing)                             |
|     |                                             | `WELCOME10` — PERCENTAGE, 10% discount, minimum cart value ₹500                                 |
|     |                                             | `SAVE20` — PERCENTAGE, 20% discount, minimum cart value ₹1,000                                  |
|     |                                             | `FLAT500` — FIXED, ₹500 discount, minimum cart value ₹2,000                                     |
|     |                                             | `MEGA1000` — FIXED, ₹1,000 discount, minimum cart value ₹5,000                                  |
|     |                                             | `INVALID123` — Non-existent code for negative testing                                           |
| 4   | Cart value control                          | Ability to set cart subtotal above/below ₹2000 for minimum order tests                          |
| 5   | Environment                                 | Application running at `http://localhost:4200`                                                  |
| 6   | API availability                            | Backend APIs `POST /cart/promocode/apply` and `POST /cart/promocode/remove` must be operational |

---

## Tagging Strategy

| Tag           | Test Cases                                                                  |
| :------------ | :-------------------------------------------------------------------------- |
| `@sanity`     | TC-PC-001, TC-PC-002, TC-PC-003, TC-PC-004, TC-PC-005, TC-PC-006            |
| `@regression` | TC-PC-001 through TC-PC-010 (all)                                           |
| `@positive`   | TC-PC-001, TC-PC-002, TC-PC-003, TC-PC-007, TC-PC-008, TC-PC-009, TC-PC-010 |
| `@negative`   | TC-PC-004, TC-PC-005, TC-PC-006                                             |

---

## Naming Convention

- **Test File**: `tests/promo-code-test.spec.ts`
- **Page Object**: `pages/promo-code-page.ts`
- **Data Config**: `promo-code-data.config.ts`
- **Test ID Pattern**: `TC-PC-XXX` (TC = Test Case, PC = Promo Code)
- **Describe Block**: `Promo Code Feature`
- **Test Title Format**: `[TC-PC-XXX] <Scenario Description> @tag1 @tag2`

---

## Section 3: Detailed Test Steps — TC-05 & TC-06

### TC-05: Apply second promo code when one is already applied — verify rejection

| Step | Action                                                                | Expected Result                                                                        |
| :--- | :-------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| 1    | **Precondition**: User is logged in, cart has item(s), on Cart page   | Cart page loaded                                                                       |
| 2    | Enter promo code `WELCOME10` and click Apply                          | Promo code applied successfully — "Promo Code Applied:" text and Remove button visible |
| 3    | Without removing, enter second promo code `SAVE20` in the input field | Input accepts text                                                                     |
| 4    | Click Apply                                                           | Error message displayed: "A promo code is already applied."                            |
| 5    | Verify original promo `WELCOME10` remains applied                     | "Promo Code Applied:" still visible, discount unchanged                                |

**Tags**: `@sanity` `@regression` `@negative`  
**Promo Codes Used**: `WELCOME10` (first), `SAVE20` (second attempt)  
**Expected Error Regex**: `/already applied/i`

---

### TC-06: Apply invalid/non-existent promo code — verify error message

| Step | Action                                                              | Expected Result                                          |
| :--- | :------------------------------------------------------------------ | :------------------------------------------------------- |
| 1    | **Precondition**: User is logged in, cart has item(s), on Cart page | Cart page loaded                                         |
| 2    | Enter promo code `INVALID123` in the promo code input field         | Input accepts text                                       |
| 3    | Click Apply                                                         | Error message displayed: "This promo code is not valid." |
| 4    | Verify no discount line appears in order summary                    | Discount row is NOT visible                              |
| 5    | Verify promo is NOT in applied state                                | No "Promo Code Applied:" text, no Remove button          |

**Tags**: `@sanity` `@regression` `@negative`  
**Promo Code Used**: `INVALID123`  
**Expected Error Regex**: `/not valid/i`
