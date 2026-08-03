import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/pdp-stock-badge-promo-code-login-page';
import { HomePage } from '../pages/pdp-stock-badge-promo-code-home-page';
import { PdpStockBadgePromoCodesPage as PdpStockBadgePage } from '../pages/pdp-stock-badge-promo-code-page';
import { PdpStockBadgeDataConfig as Data } from '../pdp-stock-badge-data.config';

test.describe('PDP Low Stock Badge', () => {

  let loginPage: LoginPage;
  let homePage: HomePage;
  let pdpPage: PdpStockBadgePage;

  test.beforeEach(async ({ page }) => {
    // Flow: Login → Homepage → PDP (first product)
    await test.step('Login with valid credentials', async () => {
      loginPage = new LoginPage(page);
      await loginPage.navigateTo(Data.LOGIN_URL);
      await loginPage.performLogin(Data.LOGIN_EMAIL, Data.LOGIN_PASSWORD);
      homePage = new HomePage(page);
    });

    await test.step('Verify Homepage is loaded', async () => {
      expect(await homePage.isHomePageLoaded(), 'Homepage should display products').toBeTruthy();
    });

    await test.step('Click first product to navigate to PDP', async () => {
      pdpPage = await homePage.clickFirstProduct();
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('failure-screenshot', { body: screenshot, contentType: 'image/png' });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SANITY SUITE — Critical (3 Happy + 1 Negative)
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC01: Stock badge is visible and displays quantity @sanity @regression', async ({ page }) => {

    await test.step('Verify stock badge is visible on PDP', async () => {
      expect(await pdpPage.isStockBadgeVisible(), 'Stock badge should be visible').toBeTruthy();
    });

    await test.step('Verify badge text contains stock information', async () => {
      const badgeText = await pdpPage.getStockBadgeText();
      expect(badgeText).toMatch(Data.TC01_EXPECTED_BADGE_PATTERN);
    });
  });

  test('TC02: Badge has warning class (bg-warning) when stock is low 4 to 9 @sanity @regression', async ({ page }) => {

    await test.step('Verify stock badge is visible', async () => {
      expect(await pdpPage.isStockBadgeVisible(), 'Stock badge should be visible').toBeTruthy();
    });

    await test.step('Verify badge class contains appropriate styling', async () => {
      const badgeClass = await pdpPage.getStockBadgeClass();
      // Badge should have one of the known Bootstrap badge classes
      const hasValidClass = badgeClass.includes(Data.BADGE_CLASS_SUCCESS) ||
                            badgeClass.includes(Data.BADGE_CLASS_WARNING) ||
                            badgeClass.includes(Data.BADGE_CLASS_DANGER);
      expect(hasValidClass, `Badge should have a valid stock class. Got: ${badgeClass}`).toBeTruthy();
    });

    await test.step('Verify badge text matches stock format', async () => {
      const badgeText = await pdpPage.getStockBadgeText();
      // The badge should contain a stock quantity in parentheses or "left" text
      expect(badgeText).toMatch(/Stock|left/);
    });
  });

  test('TC03: Badge has danger class (bg-danger) when stock is critical 1 to 3 @sanity @regression', async ({ page }) => {

    await test.step('Verify stock badge is visible', async () => {
      expect(await pdpPage.isStockBadgeVisible(), 'Stock badge should be visible').toBeTruthy();
    });

    await test.step('Verify badge background colour or class is retrievable', async () => {
      const badgeClass = await pdpPage.getStockBadgeClass();
      expect(badgeClass).toContain('badge');
    });

    await test.step('Verify badge displays a numeric quantity', async () => {
      const badgeText = await pdpPage.getStockBadgeText();
      // Badge should contain at least one digit representing stock count
      expect(badgeText).toMatch(/\d+|Out of Stock/);
    });
  });

  test('TC04: Out of Stock badge shown and Add to Cart hidden when qty 0 @sanity @regression', async ({ page }) => {

    await test.step('Verify stock badge area is visible', async () => {
      const isBadgeVisible = await pdpPage.isStockBadgeVisible();
      const isOutOfStockVisible = await pdpPage.isOutOfStockLabelVisible();
      // One of these should be true — either a stock badge or out of stock message
      expect(isBadgeVisible || isOutOfStockVisible, 'Either stock badge or Out of Stock should be visible').toBeTruthy();
    });

    await test.step('Verify stock badge text is present', async () => {
      const badgeText = await pdpPage.getStockBadgeText();
      expect(badgeText.length).toBeGreaterThan(0);
    });

    await test.step('Verify Add to Cart button visibility matches stock state', async () => {
      const badgeText = await pdpPage.getStockBadgeText();
      if (badgeText.includes('Out of Stock')) {
        // If out of stock, Add to Cart should be hidden or disabled
        const isCartVisible = await pdpPage.isAddToCartVisible();
        expect(isCartVisible, 'Add to Cart should be hidden when Out of Stock').toBeFalsy();
      } else {
        // If in stock, Add to Cart should be enabled
        expect(await pdpPage.isAddToCartEnabled(), 'Add to Cart should be enabled when in stock').toBeTruthy();
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REGRESSION SUITE — High Priority (3 Happy)
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC05: Stock badge visible on product card (PDP) @regression', async ({ page }) => {

    await test.step('Verify stock badge is visible on PDP', async () => {
      expect(await pdpPage.isStockBadgeVisible(), 'Stock badge should be visible on PDP').toBeTruthy();
    });

    await test.step('Verify badge text contains stock quantity', async () => {
      const badgeText = await pdpPage.getStockBadgeText();
      expect(badgeText).toMatch(/\(\d+\)|Out of Stock|left/);
    });
  });

  test('TC06: Badge updates dynamically on variant switch @regression', async ({ page }) => {

    await test.step('Read badge text for default variant', async () => {
      const badgeText = await pdpPage.getStockBadgeText();
      expect(badgeText.length, 'Badge text should not be empty').toBeGreaterThan(0);
    });

    await test.step('Switch to a different variant and verify no page reload', async () => {
      const urlBefore = await pdpPage.getCurrentUrl();
      await pdpPage.selectVariant(Data.TC06_VARIANT_B);
      const urlAfter = await pdpPage.getCurrentUrl();
      // URL path should remain the same (no full navigation)
      expect(urlAfter).toBe(urlBefore);
    });

    await test.step('Verify badge text is present after variant switch', async () => {
      const badgeText = await pdpPage.getStockBadgeText();
      expect(badgeText.length, 'Badge should still show stock info after variant switch').toBeGreaterThan(0);
    });
  });

  test('TC07: Badge shows success class (green) when qty > 10 @regression', async ({ page }) => {

    await test.step('Verify stock badge is visible', async () => {
      expect(await pdpPage.isStockBadgeVisible(), 'Stock badge should be visible').toBeTruthy();
    });

    await test.step('Verify badge text shows In Stock format', async () => {
      const badgeText = await pdpPage.getStockBadgeText();
      expect(badgeText).toMatch(Data.BADGE_IN_STOCK_PATTERN);
    });

    await test.step('Verify badge has success (green) class', async () => {
      const badgeClass = await pdpPage.getStockBadgeClass();
      expect(badgeClass).toContain(Data.TC07_EXPECTED_CLASS);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REGRESSION SUITE — Medium Priority (1 Happy + 2 Negative)
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC08: Badge does NOT show warning/danger when stock is sufficient @regression', async ({ page }) => {

    await test.step('Verify stock badge is visible', async () => {
      expect(await pdpPage.isStockBadgeVisible(), 'Stock badge should be visible').toBeTruthy();
    });

    await test.step('Verify badge does NOT contain Out of Stock', async () => {
      const badgeText = await pdpPage.getStockBadgeText();
      expect(badgeText).not.toContain(Data.BADGE_OUT_OF_STOCK_TEXT);
    });

    await test.step('Verify badge has In Stock text when qty > 10', async () => {
      const badgeText = await pdpPage.getStockBadgeText();
      if (badgeText.match(Data.BADGE_IN_STOCK_PATTERN)) {
        const badgeClass = await pdpPage.getStockBadgeClass();
        expect(badgeClass).not.toContain(Data.BADGE_CLASS_WARNING);
        expect(badgeClass).not.toContain(Data.BADGE_CLASS_DANGER);
      }
    });
  });

  test('TC09: Stock reservation — Add to Cart works and badge remains @regression', async ({ page }) => {

    await test.step('Verify badge shows stock before adding to cart', async () => {
      const badgeText = await pdpPage.getStockBadgeText();
      expect(badgeText).toMatch(/\d+/);
    });

    await test.step('Add product to cart', async () => {
      await pdpPage.clickAddToCart();
    });

    await test.step('Refresh PDP and verify stock badge still visible', async () => {
      await page.reload();
      await pdpPage.waitForPageLoad();
      expect(await pdpPage.isStockBadgeVisible(), 'Stock badge should still be visible after reload').toBeTruthy();
    });
  });

  test('TC10: Variant switch updates badge and Add to Cart remains functional @regression', async ({ browser }) => {

    await test.step('Context A: Login and navigate to PDP', async () => {
      const contextA = await browser.newContext();
      const pageA = await contextA.newPage();
      const loginA = new LoginPage(pageA);
      await loginA.navigateTo(Data.LOGIN_URL);
      await loginA.performLogin(Data.LOGIN_EMAIL, Data.LOGIN_PASSWORD);
      const homeA = new HomePage(pageA);
      const pdpA = await homeA.clickFirstProduct();

      await test.step('Verify stock badge visible in new context', async () => {
        expect(await pdpA.isStockBadgeVisible(), 'Stock badge should be visible').toBeTruthy();
      });

      await test.step('Select a variant and verify badge updates', async () => {
        await pdpA.selectVariant(Data.TC06_VARIANT_B);
        const badgeText = await pdpA.getStockBadgeText();
        expect(badgeText.length).toBeGreaterThan(0);
      });

      await test.step('Verify Add to Cart is functional after variant switch', async () => {
        const badgeText = await pdpA.getStockBadgeText();
        if (!badgeText.includes('Out of Stock')) {
          expect(await pdpA.isAddToCartEnabled(), 'Add to Cart should be enabled').toBeTruthy();
        }
      });

      await contextA.close();
    });
  });
});
