**KNACK SYSTEMS & SERVICES PVT LTD**

# Automation Scoping & Test Plan Matrix — Search Autocomplete

*Test automation feasibility analysis and scoping for the TechStore Search Autocomplete feature (US-01 to US-15).*

Audience: Project team and client stakeholders
Classification: Internal — Knack Confidential
Compliance: ISO 27001:2022 • GDPR

Version 1.0  •  July 2026
**CONFIDENTIAL**

---

## Document Control

| Field | Value |
| :--- | :--- |
| Document Name | Search Autocomplete — Automation Scoping & Test Plan Matrix |
| Scope | Automation feasibility and scoping for the TechStore Search Autocomplete feature |
| Audience | Project team and client stakeholders |
| Versioning | 1.0 |
| Review Cadence | Quarterly |
| Classification | Internal — Knack Confidential |
| Compliance | ISO 27001:2022 • GDPR |
| Related Documents | Search Autocomplete Feature User Stories (US-01 to US-15) |

## Revision History

| Date | Version | Author | Change Summary |
| :--- | :--- | :--- | :--- |
| 2026-07-24 | 1.0 | Senior Test Automation Engineer | Initial issue. Owner and approval defaulted — `<<TODO: confirm>>` before publication. |

---

## 1. Automation Scoping Matrix

**Technical context:** E-Commerce web application — Angular (Node.js) frontend, Java Spring Boot backend. Feasibility reasons below assume a UI automation framework with network-interception capability (e.g. Playwright/Cypress) and access to backend/analytics assertion points.

| Test ID | Scenario Description | Priority | Automation Scoped | Test Type | Automation Feasibility Reason |
| :------ | :------------------- | :------- | :---------------- | :-------- | :---------------------------- |
| TC-01 | (US-01) Typing exactly 2 characters with matching data displays the suggestion dropdown; behaviour identical on desktop and mobile web. | Critical | YES | Positive | Deterministic DOM-presence assertion against seeded catalog; parameterisable across viewports. |
| TC-02 | (US-01) Typing exactly 1 character does not render the suggestion dropdown. | Critical | YES | Negative | Simple negative DOM assertion (element absent); fully deterministic. |
| TC-03 | (US-02) With 2+ characters, dropdown returns a mix of product/category/brand suggestions, total capped at 8–10, weighted to ~2–3 products where matches allow. | High | YES | Positive | Countable, type-classified rows are assertable via DOM/data attributes with a controlled dataset. |
| TC-04 | (US-03) A product suggestion renders a thumbnail element, product name, and price. | High | YES | Positive | Presence of image node, name, and price is DOM-assertable. Note: actual image/pixel correctness is cosmetic — excluded (see §2). |
| TC-05 | (US-03) Clicking/tapping a product suggestion navigates directly to the PDP, bypassing the search results page. | Critical | YES | Positive | High-value revenue path; URL/route assertion is deterministic. |
| TC-06 | (US-04) Clicking a category suggestion navigates to the PLP filtered to that category. | High | YES | Positive | Route + active-filter state assertable against known category. |
| TC-07 | (US-05) Clicking a brand suggestion navigates to the PLP filtered to that brand. | High | YES | Positive | Route + active-filter state assertable against known brand. |
| TC-08 | (US-06) When multiple suggestion types are returned, each type is grouped under a labelled section header ("Products", "Categories", "Brands"). | Medium | YES | Positive | Section-header text and grouping structure are DOM-assertable. Visual distinction styling is cosmetic — excluded (see §2). |
| TC-09 | (US-07) A significantly higher search-volume term ranks above an equally relevant but obscure match. | High | YES | Positive | Relative-order assertion is deterministic **once** popularity/relevance weighting is confirmed — flagged as a design dependency (see §2). |
| TC-10 | (US-08) After the user pauses typing for ≥300ms, exactly one suggestions API call fires using the current input value. | Critical | YES | Positive | Network interception can assert call count and payload; core backend-load protection. |
| TC-11 | (US-08) Continuous typing (keystroke gaps < 300ms) fires no suggestions API call until the debounce interval elapses. | Critical | YES | Negative | Network interception asserts zero calls during rapid input; deterministic with controlled timing. |
| TC-12 | (US-09) A query returning zero matches renders dropdown with no products with test "no results found" | High | YES | Negative | Negative DOM assertion using a deterministic no-match term. |
| TC-13 | (US-10) With the dropdown open, Down/Up arrow keys highlight the next/previous suggestion. | High | YES | Positive | Keyboard events and highlighted-state (aria/active class) are assertable; regression-prone, high automation value. |
| TC-14 | (US-10) Pressing Enter on a highlighted suggestion selects it and fires the associated navigation action. | High | YES | Positive | Keyboard-triggered navigation asserted via route change. |
| TC-15 | (US-10) Pressing Escape closes the dropdown and no navigation occurs. | High | YES | Negative | Asserts dropdown dismissal and unchanged route; deterministic. |
| TC-16 | (US-11) Arrowing to a suggestion updates the search input text to the highlighted item; Escape/click-outside does not navigate. | Medium | YES | Positive | Input value + route assertions on keyboard interaction. |
| TC-17 | (US-12) Submitting a search / interacting with a suggestion logs an event capturing query text and action, containing no PII. | High | YES | Positive | Event schema and query/action fields assertable at the log sink; PII-absence check enforced (GDPR / ISO 27001 A.8). Requires access-controlled, audit-logged test log endpoint. |
| TC-18 | (US-13) On a mobile viewport, tapping a suggestion produces the same navigation as the desktop click. | Medium | YES | Positive | Tap navigation is route-assertable under an emulated mobile viewport. Full-width layout is cosmetic — excluded (see §2). |
| TC-19 | (US-14) On mobile, tapping outside the search box closes the dropdown and selects/navigates nothing. | Medium | YES | Negative | Dismiss behaviour + unchanged route assertable under mobile emulation. |
| TC-20 | (US-15) Suggestions appear with "no perceptible lag" once the 300ms debounce elapses, consistently across desktop and mobile web. | Medium | NO | Positive | "Perceptible lag" is subjective and non-deterministic in a functional UI run; belongs in a performance harness with a defined latency SLA, not functional automation (see §2). |

---

## 2. Automation Execution Strategy

### High-Value Targets (automate first)

These three deliver the highest ROI and guard the most business-critical or regression-prone paths:

1. **TC-05 — Product suggestion → PDP navigation (US-03).** This is the primary revenue conversion path from autocomplete. It is high-traffic, deterministic to assert, and any regression here directly impacts sales.
2. **TC-10 / TC-11 — 300ms debounce behaviour (US-08).** The debounce protects backend load and is exactly the kind of timing logic that silently regresses during refactors. Network-interception assertions catch both "too many calls" and "call fired with stale value" defects that are hard to spot manually.
3. **TC-01 / TC-02 — 2-character trigger gate (US-01).** This is the foundational gate every other suggestion behaviour depends on. Cheap to automate, fast to run, and a natural smoke-test anchor for the whole feature.

Keyboard navigation (TC-13 to TC-15) is a strong secondary target — it is high-regression, tedious to verify by hand, and important for accessibility.

### Manual / Out-of-Scope Rationale

- **TC-20 — Performance perception (US-15):** "No perceptible lag" is subjective and non-deterministic within a functional automation run (affected by network, machine load, CI noise). It should be covered by a dedicated performance/monitoring suite against an agreed latency SLA rather than pass/fail functional scripts.
- **Visual / cosmetic aspects (partial exclusions within TC-04, TC-08, TC-18):** Thumbnail/icon *image rendering fidelity*, the *visual* distinction between product and category/brand rows, and *full-width* layout correctness are cosmetic. Functional automation covers element presence and behaviour; pixel-level correctness should go to visual-regression tooling or manual review.
- **TC-09 ranking weighting (US-07) — dependency, not exclusion:** The relative-order assertion is automatable, but the exact relevance-vs-popularity weighting is an **open design item**. Until confirmed in technical design, the expected ranking outcome cannot be pinned down deterministically. Keep the scenario scoped but blocked pending sign-off on the weighting model.
- No CAPTCHA, payment, or unpredictable third-party integrations appear in this feature set, so none are excluded on those grounds.

### Prerequisites & Test Data Requirements

Before script development begins, the following must be in place:

- **Deterministic seeded catalog** with known products, categories, and brands whose names produce predictable 2+ character matches (covers TC-01, TC-03 to TC-08).
- **A guaranteed no-match term** that returns zero products, categories, and brands (TC-12).
- **Controlled search-popularity / analytics seed data** so a high-volume term can be reliably contrasted with an equally relevant obscure term (TC-09) — pending confirmation of the ranking weighting.
- **Network interception capability** in the automation framework to assert suggestions-API call count, timing, and payload (TC-10, TC-11).
- **Access to the analytics event sink / log endpoint** to assert logged query + action fields and confirm PII absence (TC-17). This endpoint must itself be access-controlled and audit-logged in line with ISO 27001:2022 Annex A; test data must use synthetic, non-personal query values only.
- **Mobile viewport / device emulation configuration** (TC-18, TC-19) and confirmation that desktop and mobile web share the same test entry points.
- **Feature flag / environment state** confirming autocomplete is enabled in the target test environment, plus stable image/CDN availability for thumbnail presence checks.
- **Stable test user session** where required — no authenticated PII is needed; use non-personal accounts.

> **Compliance note (ISO 27001:2022 • GDPR):** Test data and logged events must use synthetic, non-personal values. TC-17 specifically verifies that no PII is captured — treat any real customer identifiers appearing in logs as a defect. For any recurring, at-scale processing of real search-log data for analytics, consult the DPO / compliance team before enabling.

---

---

*Document title: Automation Scoping & Test Plan Matrix — Search Autocomplete • Classification: Internal — Knack Confidential*
*Version 1.0 • Page 1 of 1*
