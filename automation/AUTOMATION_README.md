# KnackStore App — Playwright Web E2E Automation Suite

## Automation Suite Overview

End-to-end UI automation for the **KnackStore** Angular storefront (`http://localhost:4200`), backed by the Spring Boot API (`http://localhost:8080`). Built with **Playwright Test + TypeScript** on a layered **Page Object Model (POM)**.

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

**Stack**

| Item | Value |
| --- | --- |
| Test runner | `@playwright/test` `^1.61.1` |
| Language | TypeScript (`ES2022`, `strict: true`) |
| Browser project | `chromium` using the installed **Chrome** channel |
| Execution mode | **Headed** by default (`headless: false`), `slowMo: 1000ms` for observable runs |
| Parallelism | `fullyParallel: true`|
| Reporter | Playwright **HTML** report |
| Diagnostics | Screenshot / video / trace retained **on failure** only |

**Architecture**

```
BasePOM              → low-level actions (click, fill) with retry + auto-logging
  └── BasePage       → page-level helpers (waitForPageLoad, getCurrentUrl, waitForNavigation, isVisible)
        └── Concrete pages (LoginPage, HomePage, PDPPage, CartPage, …) — domain methods only
  └── BasePageComponent → reusable UI components

PlayWrightUtil       → resilient wrapper: auto-wait + retry with exponential backoff

*-data.config.ts     → all test data (URLs, credentials, expected values) — no data in specs
```

---

## Prerequisites

| Requirement | Notes |
| --- | --- |
| **Node.js 18+** | Verified on Node `v22.14.0`. |
| **npm** | Ships with Node. |
| **Google Chrome** | The `chromium` project uses `channel: 'chrome'`, so a real Chrome install is required. |
| **KnackStore backend running** | `http://localhost:8080` — see the root [README.md](../README.md). |
| **KnackStore frontend running** | `http://localhost:4200` — the app under test. |

---

## Quick Start

```bash
# 1. From the repo root, move into the automation project
cd automation

# 2. Install dependencies
npm install

# 3. Install Playwright browsers (one-time; also ensures Chrome deps)
npx playwright install

# 4. Run the whole suite
npx playwright test

# 5. Open the HTML report
npx playwright show-report
```

Smoke-check a single fast feature first:

```bash
npx playwright test tests/search-auto-complete-test.spec.ts
```

> `package.json` currently defines **no** npm scripts, so every command below is invoked with `npx playwright ...` from the `automation/` directory.

---

## Project Structure

```
automation/
├── AUTOMATION_README.md                      # This file
├── AUTOMATION_TEST_PLAN.md                   # Automation test plan, test coverage and individual test case details
├── playwright.config.ts                      # Runner config: chromium/chrome, timeouts, reporter, artifacts
├── tsconfig.json                             # TypeScript compiler options (ES2022, strict)
├── package.json                              # Dev dependencies (@playwright/test, @types/node)
├── .gitignore                                # Ignores node_modules, test-results, playwright-report, html-pages
│
├── base-pages/                               # Framework layer — do not put feature logic here
│   ├── BasePOM.ts                            # Core actions + action logging
│   ├── BasePage.ts                           # Page helpers, static create(), waitForNavigation, isVisible
│   └── BasePageComponent.ts                  # Base for reusable UI components (header, dropdowns…)
│
├── utils/
│   └── PlayWrightUtil.ts                     # Auto-wait + retry-with-backoff wrapper around Playwright
│
├── pages/                                    # Page Objects — locators + domain methods, no assertions
│   ├── checkout-delivery-options-login-page.ts
│   ├── checkout-delivery-options-page.ts
│   ├── homepage-product-q&a-recommendation-page.ts
│   ├── loginpage-product-q&a-recommendation-page.ts
│   ├── order-history-and-reorder-page.ts
│   ├── pdp-product-q&a-recomendation-page.ts
│   ├── pdp-stock-badge-promo-code-cart-page.ts
│   ├── pdp-stock-badge-promo-code-home-page.ts
│   ├── pdp-stock-badge-promo-code-login-page.ts
│   ├── pdp-stock-badge-promo-code-page.ts
│   ├── recently-viewed-products-page.ts
│   └── search-auto-complete-page.ts
│
├── tests/                                    # Spec files — assertions + test.step() narration
│   ├── checkout-delivery-options-test.spec.ts
│   ├── order-history-and-reorder-test.spec.ts
│   ├── pdp-product-q&a-test.spec.ts
│   ├── pdp-product-recommendation-test.spec.ts
│   ├── pdp-stock-badge-test.spec.ts
│   ├── promo-code-test.spec.ts
│   ├── recently-viewed-products-test.spec.ts
│   └── search-auto-complete-test.spec.ts
│
├── *-data.config.ts                          # Per-feature test data (URLs, credentials, expected values)
│   ├── checkout-delivery-options-data.config.ts        → TestConfig
│   ├── order-history-and-reorder-data.config.ts       → TestConfig
│   ├── pdp-product-q&a-recommendation-data.config.ts  → TestConfig
│   ├── pdp-stock-badge-data.config.ts                 → PdpStockBadgeDataConfig (static members)
│   ├── promo-code-data.config.ts                      → PromoCodeDataConfig (static members)
│   ├── recently-viewed-products-data.config.ts        → TestConfig
│   └── search-auto-complete-data.config.ts            → TestConfig
│
├── testcases/                                # Manual test cases (markdown) — source of truth for specs
├── user-stories/                             # User stories & acceptance criteria per feature
├── prompts/                                  # AI prompt templates used to generate test cases, POMs, specs
├── html-pages/                               # Saved .mhtml snapshots fed to the POM generator (ignored)
│
├── playwright-report/                        # Generated HTML report (ignored)
├── test-results/                             # Generated screenshots, videos, traces (ignored)
└── node_modules/                             # Dependencies (ignored)
```

**Layering rules**

- Locators and interactions live in `pages/`; assertions live in `tests/`.
- No hard-coded test data in specs or page objects — add it to the feature's `*-data.config.ts`.
- Shared behaviour goes into `base-pages/` or `utils/PlayWrightUtil.ts`, never copy-pasted between pages.

---

## All Run Commands

Run every command from the `automation/` directory.

### Setup

| Command | Purpose |
| --- | --- |
| `npm install` | Install dev dependencies. |
| `npx playwright install` | Download Playwright browsers. |
| `npx playwright install chromium` | Install only Chromium. |
| `npx playwright install --with-deps` | Install browsers + OS dependencies (Linux/CI). |
| `npx playwright --version` | Print the Playwright version. |

### Run by tag

| Command | Purpose |
| --- | --- |
| `npx playwright test --grep "@sanity"` | Sanity suite. |
| `npx playwright test --grep "@regression"` | Full regression suite. |
| `npx playwright test --grep "@positive"` | Positive-path tests. |
| `npx playwright test --grep "@negative"` | Negative / validation tests. |
| `npx playwright test --grep "@sanity\|@positive"` | Union of two tags. |
| `npx playwright test --grep "(?=.*@sanity)(?=.*@regression)"` | Intersection of two tags. |
| `npx playwright test --grep "@regression" --grep-invert "@negative"` | Regression minus negative cases. |

### Run the suite

| Command | Purpose |
| --- | --- |
| `npx playwright test` | Run all tests (headed Chrome, as configured). |
| `npx playwright test --project=chromium` | Run the `chromium` project explicitly. |
| `npx playwright test --headed` | Force headed mode. |
| `npx playwright test --headed=false` | Force headless mode for a run. |
| `npx playwright test --workers=1` | Serial execution — useful when debugging shared-state flakiness. |
| `npx playwright test --workers=4` | Raise parallelism. |
| `npx playwright test --retries=2` | Retry failures twice locally (CI already retries twice). |
| `npx playwright test --repeat-each=3` | Re-run each test 3× to hunt flakiness. |
| `npx playwright test --max-failures=1` | Stop after the first failure. |
| `npx playwright test --fail-on-flaky-tests` | Treat flaky results as failures. |
| `CI=1 npx playwright test` | CI behaviour: `forbidOnly`, 2 retries, 1 worker. |

### Run a subset

| Command | Purpose |
| --- | --- |
| `npx playwright test tests/search-auto-complete-test.spec.ts` | Single spec file. |
| `npx playwright test tests/promo-code-test.spec.ts tests/pdp-stock-badge-test.spec.ts` | Multiple spec files. |
| `npx playwright test "tests/pdp-*"` | Glob — all PDP specs (quote the pattern). |
| `npx playwright test -g "TC-01"` | Tests whose title matches a pattern. |
| `npx playwright test -g "Search Autocomplete"` | Whole `describe` block by title. |
| `npx playwright test --grep-invert "@regression"` | Everything except regression. |
| `npx playwright test tests/search-auto-complete-test.spec.ts:34` | Single test by file:line. |
| `npx playwright test --last-failed` | Re-run only the tests that failed last time. |
| `npx playwright test --only-changed` | Run specs affected by uncommitted changes. |
| `npx playwright test --list` | List matching tests without running them. |

---

## Reporting

### Artifacts produced by a run

| Artifact | Location | When |
| --- | --- | --- |
| HTML report | `playwright-report/index.html` | Every run (`reporter: 'html'`). |
| Screenshots | `test-results/<test>/` | On failure (`screenshot: 'only-on-failure'`), plus explicit full-page attachments in `afterEach`. |
| Video | `test-results/<test>/` | On failure/retry (`video: 'retain-on-failure'`). |
| Trace | `test-results/<test>/trace.zip` | On failure/retry (`trace: 'retain-on-failure'`). |

All of these folders are git-ignored — they are regenerated on every run and must never be committed.

### Reading the HTML report

```bash
npx playwright test          # produces playwright-report/
npx playwright show-report   # serves it on a local port
```

The report gives you, per test: pass/fail/flaky status and duration, the full `test.step()` breakdown (each step mirrors a manual test-case step), any attached failure screenshot, and links to the video and trace.

### Reading a trace

```bash
npx playwright show-trace test-results/<test-folder>/trace.zip
```

The trace viewer provides an action-by-action timeline with DOM snapshots before/after each action, plus network, console and source panes — the fastest way to diagnose a locator or timing failure.