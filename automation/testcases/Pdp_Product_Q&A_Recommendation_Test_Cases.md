

## Section 1: Automation Scoping Matrix

| Test ID | Scenario Description | Priority | Automation Scoped | Test Type | Automation Feasibility Reason |
| :------ | :------------------- | :------- | :---------------- | :-------- | :---------------------------- |
| QA-001 | Verify Q&A section is visible below the Reviews section on PDP | Critical | YES | Positive | DOM order/position assertion — straightforward UI check |
| QA-002 | Verify Q&A section heading displays "Customer Questions & Answers" | Critical | YES | Positive | Static text assertion on heading element |
| QA-003 | Verify questions are listed in reverse chronological order (most recent first) | High | YES | Positive | Compare displayed date sequence — deterministic with seeded test data |
| QA-004 | Verify answered questions display the answer text beneath the question | Critical | YES | Positive | Element visibility and text content assertion |
| QA-005 | Verify answered questions show the answerer's role label "Customer" | High | YES | Positive | Text/badge assertion on answer block |
| QA-006 | Verify answered questions show the answerer's role label "Team" | High | YES | Positive | Text/badge assertion on answer block |
| QA-007 | Verify unanswered questions do NOT display an answer block | High | YES | Negative | Assert absence of answer container element |
| QA-008 | Verify guest user can read all questions and answers without login | Critical | YES | Positive | Navigate as unauthenticated user, assert content visible |
| QA-009 | Verify guest user does NOT see a "Post Question" or "Ask" action button | High | YES | Negative | Assert element not present/hidden for guest session |
| QA-010 | Verify guest user sees a login prompt or disabled state when attempting to post | Medium | YES | Negative | UI state assertion — button disabled or login CTA visible |
| QA-011 | Verify Q&A section renders correctly when no questions exist for the product | Medium | YES | Negative | Empty-state UI assertion (requires product with zero Q&A) |
| QA-012 | Verify Q&A section loads without layout shift or visual overlap with Reviews section | Low | NO | Positive | Visual/layout regression — requires visual comparison tooling, non-deterministic pixel checks |

---

## Section 2: Automation Execution Strategy

### High-Value Targets (Automate First)

1. **QA-001 + QA-002** — Validates the section exists and is correctly labeled. Foundation for all other Q&A tests; fast to implement, high regression value.
2. **QA-004 + QA-005 + QA-006** — Validates the core answered-question rendering with role labels. Covers the primary user value of the feature.
3. **QA-008 + QA-009** — Guest access visibility/restriction. Critical for access-control correctness without login overhead.

### Manual / Out-of-Scope Rationale

| Test ID | Reason |
| :------ | :----- |
| QA-012 | Visual layout overlap detection requires pixel-level comparison (e.g., Percy, Applitools). Not feasible with DOM-only assertions. Recommend manual exploratory or dedicated visual regression suite. |

### Prerequisites & Test Data Requirements

| Requirement | Details |
| :---------- | :------ |
| **Product with Q&A data** | Product ID `4` at `http://localhost:4200/products/4` must have seeded questions — at least one answered by "Customer", one answered by "Team", and one unanswered |
| **Chronological ordering data** | At least 3 questions with distinct, known creation timestamps to validate sort order |
| **Product with zero Q&A** | A separate product (or teardown state) with no questions for QA-011 empty-state test |
| **Guest session** | Tests QA-008/009/010 must run without authentication — no stored tokens or cookies |
| **Logged-in session** | Not required for this story (View-only), but needed if "Post Question" story is combined later |
| **Environment** | Local dev server running at `http://localhost:4200` with seeded database |






Updated todo list

## Section 1: Automation Scoping Matrix

| Test ID | Scenario Description | Priority | Automation Scoped | Test Type | Automation Feasibility Reason |
| :------ | :------------------- | :------- | :---------------- | :-------- | :---------------------------- |
| QA-003 | Verify text area and "Submit Question" button are visible for logged-in users | Critical | YES | Positive | DOM element visibility assertion — straightforward UI check |
| QA-004 | Verify text area and "Submit Question" button are positioned at the bottom of the Q&A list | High | YES | Positive | DOM position/order assertion using boundingBox or element index |
| QA-005 | Verify character counter displays initially at 0/200 | High | YES | Positive | Static text assertion on counter element |
| QA-006 | Verify character counter updates live as user types in text area | Critical | YES | Positive | Dynamic text assertion — type text, verify counter increments |
| QA-007 | Verify character counter prevents input beyond 200 characters (client-side) | Critical | YES | Negative | Input validation — attempt 201 characters, verify block/truncation |
| QA-008 | Verify character counter displays correct count at boundary (exactly 200 characters) | High | YES | Positive | Boundary value testing — enter exactly 200 chars, verify counter shows 200/200 |
| QA-009 | Verify "Submit Question" button is enabled when text area has valid input (1-200 characters) | High | YES | Positive | Button state assertion — verify enabled attribute/class |
| QA-010 | Verify "Submit Question" button is disabled when text area is empty | High | YES | Negative | Button state assertion — verify disabled attribute/class |
| QA-011 | Verify successful question submission with valid input (e.g., 50 characters) | Critical | YES | Positive | Form submission + success feedback assertion (toast/message) |
| QA-012 | Verify question appears in Q&A list after successful submission | Critical | YES | Positive | DOM assertion — verify new question element appears in list |
| QA-013 | Verify server-side validation blocks submission beyond 200 characters | High | YES | Negative | Bypass client validation (dev tools), submit 201+ chars, verify error response |
| QA-014 | Verify attempting a second question on the same product shows blocking message | Critical | YES | Negative | Submit first question, attempt second, verify error message text matches |
| QA-015 | Verify blocking message text: "Only one question per product is allowed" | Critical | YES | Negative | Exact text assertion on error message element |
| QA-016 | Verify "Submit Question" button is hidden/disabled after first question submission | High | YES | Negative | Element state assertion after first submission |
| QA-017 | Verify guest user does NOT see text area and "Submit Question" button | Critical | YES | Negative | Navigate as unauthenticated user, assert elements absent |
| QA-018 | Verify guest user sees login prompt when attempting to ask a question | High | YES | Negative | Click "Ask Question" CTA (if shown), verify login modal/redirect |
| QA-019 | Verify login prompt contains link/button to navigate to login page | Medium | YES | Positive | Assert presence of login link/button in prompt |
| QA-020 | Verify character counter handles special characters correctly (emojis, unicode) | Medium | YES | Positive | Enter special chars, verify counter increments correctly |
| QA-021 | Verify character counter handles paste operation correctly | Medium | YES | Positive | Paste 250-char text, verify truncation or block at 200 |
| QA-022 | Verify text area supports multiline input within 200-character limit | Low | YES | Positive | Enter text with line breaks, verify submission success |
| QA-023 | Verify question submission clears text area and resets counter | Medium | YES | Positive | Submit question, verify text area empty and counter reset |
| QA-024 | Verify layout and styling of character counter (visual position, color coding) | Low | NO | Positive | Visual/cosmetic verification — requires visual regression or manual review |
| QA-025 | Verify error message styling and positioning when duplicate question blocked | Low | NO | Positive | Visual/layout verification — manual review preferred |

---

## Section 2: Automation Execution Strategy

### High-Value Targets (Automate First)

1. **QA-006 + QA-007** — Live character counter validation (client-side). Core functionality that validates real-time UI feedback and input enforcement. High regression risk if broken.

2. **QA-014 + QA-015** — Duplicate question blocking with exact error message. Critical business rule enforcement. Must validate both blocking behavior and message accuracy.

3. **QA-017 + QA-018** — Guest user restrictions. Validates access control — ensures guests cannot bypass restrictions and are properly prompted to authenticate.

### Manual / Out-of-Scope Rationale

| Test ID | Reason |
| :------ | :----- |
| QA-024 | Visual styling verification (color, font, position) requires pixel-level comparison or human judgment. Recommend manual exploratory testing or dedicated visual regression suite (Percy, Applitools). |
| QA-025 | Error message layout/styling validation — subjective cosmetic review better suited for manual QA or design review. |

### Prerequisites & Test Data Requirements

| Requirement | Details |
| :---------- | :------ |
| **Logged-in user session** | Valid authenticated user with credentials (e.g., `demo@knack.com` / `Demo@1234` from TestConfig) |
| **Guest/unauthenticated session** | Browser session with no auth tokens or cookies for guest tests (QA-017, QA-018) |
| **Product with existing Q&A** | Product ID with at least one existing question to test "Ask Question" UI placement (bottom of list) |
| **Product without user's question** | Clean product where logged-in user has NOT yet asked a question (for QA-011, QA-012) |
| **Product with user's existing question** | Product where logged-in user has ALREADY asked one question (for QA-014, QA-015, QA-016 — duplicate blocking) |
| **Server-side validation endpoint** | Backend API endpoint accessible for QA-013 (bypassing client validation requires direct HTTP call or dev tools manipulation) |
| **Character counter logic** | Frontend implementation must support real-time updates on `input` or `keyup` events |
| **URL for automation** | Product detail page URL, e.g., `http://localhost:4200/products/4` |

### Additional Considerations

- **State Management**: Tests QA-014–QA-016 (duplicate question blocking) require setting up user state where one question already exists. Consider:
  - Pre-seeded test data in database, OR
  - Two-step test: submit first question programmatically, then verify blocking behavior
  
- **Character Counter Implementation**: Verify whether counter uses `maxlength` attribute (hard block) or JavaScript validation (soft warning). This affects QA-007 automation approach.

- **Login Prompt Behavior**: QA-018 depends on how the app handles guest interaction. Possible implementations:
  - Modal overlay with login form
  - Redirect to `/login` page
  - Inline message with login link
  
  Automation must handle all variants or clarify expected behavior.

- **Server-Side Validation (QA-013)**: Requires bypassing client-side checks. Options:
  - Modify DOM attributes (`maxlength`) via Playwright's `evaluate()`
  - Direct API call (if backend exposed)
  - Disable JavaScript and submit form



  ## Product Recommendations Test Cases

Updated todo list

## Section 1: Automation Scoping Matrix

| Test ID | Scenario Description | Priority | Automation Scoped | Test Type | Automation Feasibility Reason |
| :------ | :------------------- | :------- | :---------------- | :-------- | :---------------------------- |
| REC-001 | Verify "Frequently Bought Together" section is visible on PDP | Critical | YES | Positive | DOM element visibility assertion — straightforward UI check |
| REC-002 | Verify recommendation section is positioned below product description and near reviews section | High | YES | Positive | DOM order/position assertion using boundingBox or element index |
| REC-003 | Verify recommendation section displays exactly 3 products when more than 3 co-purchased products exist | Critical | YES | Positive | Count validation — count recommendation cards in DOM |
| REC-004 | Verify top 3 products are displayed by co-purchase frequency (highest first) | High | YES | Positive | Requires seeded test data with known co-purchase frequencies — validate product IDs/names in expected order |
| REC-005 | Verify out-of-stock products are excluded from recommendations | Critical | YES | Negative | Test with product having out-of-stock co-purchase item — verify exclusion from list |
| REC-006 | Verify discontinued products are excluded from recommendations | Critical | YES | Negative | Test with product having discontinued co-purchase item — verify exclusion from list |
| REC-007 | Verify the viewed product itself does not appear in its own recommendations | Critical | YES | Negative | Navigate to PDP, verify product ID/name does not match any recommendation card |
| REC-008 | Verify recommended product Cards from Frequently Bought Together section | Critical | YES | Negative | Test Recommended Product Cards contain all the details  |
| REC-009 | Verify each frequently bought product contains "View Details" button - REC-017 | Critical | YES | Positive | View Details Button Visibility |
| REC-010 | Verify each recommended product card displays product image | Critical | YES | Positive | Image element visibility and src attribute validation |
| REC-010 | Verify each recommended product card displays product image | Critical | YES | Positive | Image element visibility and src attribute validation |
| REC-011 | Verify each recommended product card displays product name | Critical | YES | Positive | Text content assertion on product name element |
| REC-012 | Verify each recommended product card displays product price | Critical | YES | Positive | Text content assertion on price element |
| REC-013 | Verify each recommended product card displays product rating | High | YES | Positive | Rating element visibility and value assertion |
| REC-014 | Verify product card format matches product listing page (PLP) styling | Medium | NO | Positive | Visual/cosmetic verification — requires visual regression or manual review |
| REC-015 | Verify recommendation section is visible for guest users | Critical | YES | Positive | Navigate as unauthenticated user, assert section visibility |
| REC-016 | Verify recommendation section is visible for logged-in users | Critical | YES | Positive | Navigate as authenticated user, assert section visibility |
| REC-017 | Verify recommendation section behaves identically for guest and logged-in users | High | YES | Positive | Compare recommendation count, products, and layout between sessions |
| REC-018 | Verify recommendation section is NOT displayed above the fold | Medium | YES | Negative | Viewport assertion — verify section Y-position > viewport height |
| REC-019 | Verify recommendation section heading displays correct text | High | YES | Positive | Text assertion on section heading (e.g., "Frequently Bought Together") |
| REC-020 | Verify clicking on recommended product card navigates to correct PDP | High | YES | Positive | Click card, verify URL navigation to expected product |
| REC-021 | Verify recommendation section handles products with fewer than 3 co-purchases | Medium | YES | Negative | Test product with 1-2 co-purchases — verify display of available items only |
| REC-022 | Verify recommendation section is empty/hidden when product has no co-purchase data | Medium | YES | Negative | Test product with zero co-purchases — verify section hidden or shows empty state |
| REC-023 | Verify recommended product price format matches PLP price format | Low | NO | Positive | Format/styling verification — manual review preferred |
| REC-024 | Verify recommended product images are loaded correctly (no broken images) | Medium | YES | Positive | Image load state assertion — check naturalWidth > 0 |

---

## Section 2: Automation Execution Strategy

### High-Value Targets (Automate First)

1. **REC-001 + REC-002 + REC-003** — Core recommendation section validation (visibility, position, count). Foundation tests that validate the feature exists and is correctly placed. High regression value.

2. **REC-005 + REC-006 + REC-007** — Business rule enforcement (exclusions). Critical logic that prevents invalid recommendations from appearing. Ensures data integrity.

3. **REC-015 + REC-016 + REC-017** — Access control parity. Validates that the feature works equally for guest and logged-in users, covering major user segments.

### Manual / Out-of-Scope Rationale

| Test ID | Reason |
| :------ | :----- |
| REC-014 | Visual styling consistency (card format matching PLP) requires pixel-level comparison or human judgment. Recommend manual exploratory testing or dedicated visual regression suite (Percy, Applitools). |
| REC-023 | Price format styling verification is subjective and cosmetic. Manual review by QA/design team is more appropriate. |

### Prerequisites & Test Data Requirements

| Requirement | Details |
| :---------- | :------ |
| **Product with 3+ co-purchases** | Product ID with precomputed co-purchase data containing at least 3 valid products (in stock, not discontinued) for REC-001 through REC-004 |
| **Product with out-of-stock co-purchase** | Product ID where at least one co-purchased item is marked out-of-stock for REC-005 |
| **Product with discontinued co-purchase** | Product ID where at least one co-purchased item is discontinued for REC-006 |
| **Product that could recommend itself** | Product with variant that appears in co-purchase data to test self-exclusion (REC-007) |
| **Product with duplicate signals** | Product where same item qualifies via multiple co-purchase paths for deduplication testing (REC-008) |
| **Product with category + co-purchase mix** | Product with both same-category products and co-purchase-based recommendations to validate priority order (REC-009) |
| **Product with < 3 co-purchases** | Product with only 1 or 2 co-purchase entries for REC-021 |
| **Product with zero co-purchases** | Product with no co-purchase data for REC-022 empty state testing |
| **Guest/unauthenticated session** | Browser session with no auth tokens for REC-015 |
| **Logged-in user session** | Valid authenticated user (e.g., `demo@knack.com` from TestConfig) for REC-016 |
| **PDP URL** | Base URL for product pages, e.g., `http://localhost:4200/products/{id}` |
| **Recommendation section identifier** | CSS selector or test ID for recommendation section container (e.g., `.recommendations-section`, `[data-testid="frequently-bought-together"]`) |
| **Product card structure** | Consistent DOM structure for recommendation cards including image, name, price, rating elements |

### Additional Considerations

- **Data Synchronization**: REC-004 (co-purchase frequency ordering) requires stable, seeded test data. Coordinate with backend team to ensure precomputed pairing data is available in test environments.

- **Open Question Resolution**: REC-005/REC-006 assume out-of-stock/discontinued products are excluded. This is flagged as an open question in the FSD. **Confirm handling with product team before automating** — behavior may be:
  - Exclude entirely (current assumption)
  - Show with "Out of Stock" badge
  - Replace with next eligible product
  
  Automation approach will vary based on final decision.

- **Visual Consistency (REC-014, REC-023)**: While marked manual, consider capturing baseline screenshots for critical product cards and using visual regression tools for ongoing validation once UI stabilizes.

- **Performance Consideration**: If co-purchase data is loaded asynchronously, add wait conditions to ensure recommendation section is fully populated before assertions (use `waitFor` on section container with visible state).

- **Deduplication Testing (REC-008)**: Requires understanding backend recommendation logic. May need collaboration with backend team to create test product with intentional duplicate signals.