# Copilot Instructions for Project1

## Project Overview
This is a Playwright end-to-end testing project for the Knack Systems website (https://www.knacksystems.com/). Tests focus on comprehensive footer section validation across multiple browsers.

## Test Structure & Patterns

### File Organization
- `tests/footer.spec.ts`: Main test suite with 60+ tests organized into nested `test.describe()` blocks
- `tests/example.spec.ts`: Playwright template examples (reference only)
- Test results stored in `test-results/` with format: `{test-file}-{test-name}-{hash}-{browser}/`

### Critical Test Patterns

**1. Consistent BeforeEach Setup**
All tests use this pattern to ensure footer visibility:
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('https://www.knacksystems.com/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
});
```

**2. Footer-Scoped Locators**
Always scope selectors to the footer element to avoid conflicts:
```typescript
// Correct
const link = page.locator('footer').getByRole('link', { name: 'Apparel & Fashion' });

// Incorrect (avoid global selectors)
const link = page.getByRole('link', { name: 'Apparel & Fashion' });
```

**3. Link Validation Pattern**
Every link test follows this structure:
```typescript
test('should have {Name} link', async ({ page }) => {
  const link = page.locator('footer').getByRole('link', { name: '{LinkText}' });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', /{url-pattern}/);
});
```

**4. Nested Test Organization**
Tests are organized by footer sections (11 sections total):
- Industries Section
- Line of Business Section
- Solutions Section
- Services Section
- Insight and News Section
- Company Section
- Social Media Links
- Podcast Links
- Copyright and Legal Links
- Email Contact
- Back to Top Button

## Commands & Workflows

### Running Tests
```bash
npx playwright test                    # Run all tests
npx playwright test footer.spec.ts     # Run specific file
npx playwright test --project=chromium # Run single browser
npx playwright show-report            # View HTML report
```

### Browser Configuration
Tests run on 3 browsers by default (configured in [playwright.config.ts](playwright.config.ts)):
- chromium (Desktop Chrome)
- firefox (Desktop Firefox)
- webkit (Desktop Safari)

Each test execution creates 3 result folders (one per browser).

## Project-Specific Conventions

### Test Naming
- Use descriptive names: `should have {Element} link` or `should display {Section} heading`
- Navigation tests: `should navigate to {Page} when clicked`

### URL Pattern Matching
Use regex patterns for flexible URL validation:
```typescript
await expect(link).toHaveAttribute('href', /apparel-and-fashion/);
```

### Handling Multiple Elements
When multiple elements share the same text, use `.first()`:
```typescript
const heading = page.locator('footer').getByText('Industries', { exact: true }).first();
```

### Special Cases
- Social media icons: Use `href` attribute selectors when `name` isn't available
- Email links: Verify `mailto:` protocol explicitly
- Regex names: Use for flexible matching (e.g., `/Configure, Price and Quote/`)

## When Adding New Tests

1. **Place tests in appropriate `test.describe()` block** based on footer section
2. **Follow the established pattern**: visibility check + href validation for links
3. **Scope all locators to footer**: `page.locator('footer').{selector}`
4. **Use exact matching for headings**: `{ exact: true }` to avoid substring matches
5. **Test navigation separately**: Create tests in "Footer Navigation Tests" section if click behavior is critical

## Common Pitfalls to Avoid

- ❌ Don't use global selectors (always scope to footer)
- ❌ Don't skip the scroll in beforeEach (footer may not be in viewport)
- ❌ Don't assume single elements (use `.first()` when multiple matches possible)
- ❌ Don't hardcode full URLs in tests (use regex patterns for flexibility)
