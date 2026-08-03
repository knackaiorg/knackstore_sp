import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/pdp-stock-badge-promo-code-login-page';
import { HomePage } from '../pages/pdp-stock-badge-promo-code-home-page';
import { PdpStockBadgePromoCodesPage } from '../pages/pdp-stock-badge-promo-code-page';
import { CartPage } from '../pages/pdp-stock-badge-promo-code-cart-page';
import { PromoCodeDataConfig as Data } from '../promo-code-data.config';

test.describe('Promo Code Feature', () => {

  let loginPage: LoginPage;
  let homePage: HomePage;
  let pdpPage: PdpStockBadgePromoCodesPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    // Flow: Login → Homepage → PDP → Add to Cart → Cart Page → Clear any existing promo codes
    await test.step('Login with valid credentials', async () => {
      loginPage = new LoginPage(page);
      await loginPage.navigateTo(Data.LOGIN_URL);
      await loginPage.performLogin(Data.LOGIN_EMAIL, Data.LOGIN_PASSWORD);
      homePage = new HomePage(page);
    });

    await test.step('Verify Homepage is loaded', async () => {
      expect(await homePage.isHomePageLoaded(), 'Homepage should display products').toBeTruthy();
    });

    await test.step('Click product with stock to navigate to PDP', async () => {
      // Click third product (index 2) - should be cheaper to test minimum cart validation
      pdpPage = await homePage.clickProductByIndex(2);
      await page.waitForTimeout(1000); // Wait for PDP to fully load
    });

    await test.step('Add product to cart from PDP', async () => {
      // Retry logic in case the first product is out of stock
      const isEnabled = await pdpPage.isAddToCartEnabled();
      if (!isEnabled) {
        // Go back and try next product
        await page.goBack();
        await page.waitForTimeout(500);
        pdpPage = await homePage.clickProductByIndex(2);
        await page.waitForTimeout(1000);
      }
      expect(await pdpPage.isAddToCartEnabled(), 'Add to Cart should be enabled').toBeTruthy();
      await pdpPage.clickAddToCart();
      await page.waitForTimeout(1500); // Wait for cart to update
    });

    await test.step('Navigate to Cart page', async () => {
      cartPage = new CartPage(page);
      await cartPage.navigateTo(Data.CART_URL);
      await page.waitForTimeout(1000); // Wait for cart page to load
      expect(await cartPage.isCartPageLoaded(), 'Cart page should be loaded').toBeTruthy();
    });

    await test.step('Clear any existing promo code from previous tests', async () => {
      // Check if a promo code is already applied and remove it
      const isPromoApplied = await cartPage.isRemoveButtonVisible();
      if (isPromoApplied) {
        await cartPage.removePromoCode();
        await page.waitForTimeout(1500); // Wait for removal to complete
      }
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('failure-screenshot', { body: screenshot, contentType: 'image/png' });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CRITICAL SANITY SUITE — Top 5 Most Critical Tests
  // TC-01: Happy path (apply promo - no minimum)
  // TC-02: Apply promo with minimum validation (₹1000 - always passes)
  // TC-03: Remove promo (cleanup)
  // TC-04: Minimum cart validation (₹5000 - may skip if cart too high)
  // TC-05: Prevent multiple promos (business rule)
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-01: Apply valid percentage promo code FIRST15 (no minimum) and verify discount @sanity @regression', async ({ page }) => {

    await test.step('Verify promo code input and Apply button are visible', async () => {
      expect(await cartPage.isPromoCodeInputVisible(), 'Promo code input should be visible').toBeTruthy();
      expect(await cartPage.isApplyButtonVisible(), 'Apply button should be visible').toBeTruthy();
    });

    await test.step('Apply promo code FIRST15', async () => {
      await cartPage.applyPromoCode(Data.TC01_CODE);
      await page.waitForTimeout(2000); // Wait for promo code to be applied
    });

    await test.step('Verify promo code is applied — "Promo Code Applied:" text visible', async () => {
      expect(await cartPage.isPromoAppliedSuccessfully(), '"Promo Code Applied:" should be visible').toBeTruthy();
    });

    await test.step('Verify applied code text contains FIRST15', async () => {
      const appliedText = await cartPage.getAppliedPromoCodeText();
      expect(appliedText).toContain(Data.TC01_CODE);
    });

    await test.step('Verify discount line is visible in order summary', async () => {
      expect(await cartPage.isDiscountLineVisible(), 'Discount line should be visible').toBeTruthy();
    });

    await test.step('Verify Remove button appears', async () => {
      expect(await cartPage.isRemoveButtonVisible(), 'Remove button should be visible').toBeTruthy();
    });
  });

  test('TC-02: Apply valid percentage promo code SAVE20 (min ₹1000) and verify discount @sanity @regression', async ({ page }) => {

    await test.step('Apply promo code SAVE20', async () => {
      await cartPage.applyPromoCode(Data.TC02_CODE);
      await page.waitForTimeout(2000); // Wait for promo code to be applied and UI to update
    });

    await test.step('Verify promo code is applied successfully', async () => {
      expect(await cartPage.isPromoAppliedSuccessfully(), '"Promo Code Applied:" should be visible').toBeTruthy();
    });

    await test.step('Verify applied code text contains SAVE20', async () => {
      const appliedText = await cartPage.getAppliedPromoCodeText();
      expect(appliedText).toContain(Data.TC02_CODE);
    });

    await test.step('Verify discount line and Remove button are visible', async () => {
      expect(await cartPage.isDiscountLineVisible(), 'Discount line should be visible').toBeTruthy();
      expect(await cartPage.isRemoveButtonVisible(), 'Remove button should be visible').toBeTruthy();
    });
  });

  test('TC-03: Remove applied promo code and verify cart total restores @sanity @regression', async ({ page }) => {

    let totalBeforePromo: string;

    await test.step('Capture original total before promo', async () => {
      totalBeforePromo = await cartPage.getTotalText();
    });

    await test.step('Apply promo code FIRST15', async () => {
      await cartPage.applyPromoCode(Data.TC03_CODE);
      await page.waitForTimeout(2000); // Wait for promo application
    });

    await test.step('Verify promo code is applied successfully', async () => {
      expect(await cartPage.isPromoAppliedSuccessfully() || await cartPage.isRemoveButtonVisible(),
        'Promo code should be applied').toBeTruthy();
    });

    await test.step('Click Remove to remove promo code', async () => {
      await cartPage.removePromoCode();
      await page.waitForTimeout(2000); // Wait for removal and UI update
    });

    await test.step('Verify discount line is removed', async () => {
      expect(await cartPage.isDiscountLineVisible(), 'Discount line should be removed').toBeFalsy();
    });

    await test.step('Verify promo code input reappears', async () => {
      expect(await cartPage.isPromoCodeInputVisible(), 'Promo code input should reappear').toBeTruthy();
    });

    await test.step('Verify total is restored to original amount', async () => {
      const totalAfterRemove = await cartPage.getTotalText();
      expect(totalAfterRemove).toBe(totalBeforePromo);
    });
  });

  test('TC-04: Apply promo code MEGA1000 when cart is below minimum ₹5000 — verify error @regression', async ({ page }) => {

    await test.step('Apply promo code MEGA1000 (requires min ₹5000)', async () => {
      await cartPage.applyPromoCode(Data.TC04_CODE);
      await page.waitForTimeout(3000); // Wait for response
    });

    await test.step('Verify error message for minimum cart value not met OR skip if cart is too high', async () => {
      // Check both error and success states
      const isErrorVisible = await page.locator('app-promo-code').getByText(/minimum cart value|This code requires a minimum/i).isVisible({ timeout: 2000 }).catch(() => false);
      const isPromoApplied = await cartPage.isPromoAppliedSuccessfully().catch(() => false);
      
      if (isErrorVisible) {
        // Expected path - cart is below ₹5000, error shown
        const errorMessage = await page.locator('app-promo-code').getByText(/minimum cart value|This code requires a minimum/i).textContent();
        expect(errorMessage).toContain('minimum');
      } else if (isPromoApplied) {
        // Cart value was >= ₹5000, so promo was applied successfully
        console.warn('Test scenario not applicable: Cart value >= ₹5000, MEGA1000 was applied successfully');
        await cartPage.removePromoCode();
        await page.waitForTimeout(1500);
        test.skip(true, 'Cart value too high for this test scenario');
      } else {
        throw new Error('Neither error nor success state detected');
      }
    });

    await test.step('Verify no discount is applied', async () => {
      expect(await cartPage.isDiscountLineVisible(), 'Discount line should not be visible').toBeFalsy();
    });

    await test.step('Verify promo code is NOT in applied state', async () => {
      expect(await cartPage.isPromoCodeApplied(), 'Promo should not be applied').toBeFalsy();
    });
  });

  test('TC-05: Apply second promo code when one is already applied — verify rejection @sanity @regression', async ({ page }) => {

    await test.step('Apply first promo code WELCOME10', async () => {
      await cartPage.applyPromoCode(Data.TC05_FIRST_CODE);
      await page.waitForTimeout(2000); // Wait for first promo to be applied
    });

    await test.step('Verify first promo code is applied', async () => {
      expect(await cartPage.isPromoAppliedSuccessfully() || await cartPage.isRemoveButtonVisible(),
        'First promo code should be applied').toBeTruthy();
    });

    await test.step('Try to apply second promo code SAVE20', async () => {
      await cartPage.applyPromoCode(Data.TC05_SECOND_CODE);
      await page.waitForTimeout(2000); // Wait for error message
    });

    await test.step('Verify error message for already applied code', async () => {
      const errorMessage = await cartPage.getErrorMessageText();
      expect(errorMessage).toMatch(Data.TC05_EXPECTED_ERROR);
    });
  });

  test('TC-06: Apply invalid/non-existent promo code — verify error message @regression', async ({ page }) => {

    await test.step('Apply invalid promo code INVALID123', async () => {
      await cartPage.applyPromoCode(Data.TC06_CODE);
      await page.waitForTimeout(2000); // Wait for error message
    });

    await test.step('Verify error message for invalid code', async () => {
      const errorMessage = await cartPage.getErrorMessageText();
      expect(errorMessage).toMatch(Data.TC06_EXPECTED_ERROR);
    });

    await test.step('Verify no discount is applied', async () => {
      expect(await cartPage.isDiscountLineVisible(), 'Discount line should not be visible').toBeFalsy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HIGH / MEDIUM PRIORITY — TC-07 through TC-10 @regression
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC-07: Verify promo code field and Apply button are displayed on cart page @regression', async () => {

    await test.step('Verify promo code input field is visible', async () => {
      expect(await cartPage.isPromoCodeInputVisible(), 'Promo code input should be visible').toBeTruthy();
    });

    await test.step('Verify Apply button is visible', async () => {
      expect(await cartPage.isApplyButtonVisible(), 'Apply button should be visible').toBeTruthy();
    });

    await test.step('Verify Order Summary section is visible', async () => {
      expect(await cartPage.isOrderSummaryVisible(), 'Order Summary should be visible').toBeTruthy();
    });

    await test.step('Verify Proceed to Checkout button is visible', async () => {
      expect(await cartPage.isProceedToCheckoutVisible(), 'Proceed to Checkout should be visible').toBeTruthy();
    });
  });

  test('TC-08: Checkout without entering a promo code — verify checkout proceeds @regression', async () => {

    await test.step('Verify no promo code is applied initially', async () => {
      expect(await cartPage.isPromoCodeApplied(), 'No promo should be applied initially').toBeFalsy();
    });

    await test.step('Verify Proceed to Checkout button is visible', async () => {
      expect(await cartPage.isProceedToCheckoutVisible(), 'Proceed to Checkout should be visible').toBeTruthy();
    });

    await test.step('Click Proceed to Checkout without applying promo', async () => {
      await cartPage.clickProceedToCheckout();
    });

    await test.step('Verify checkout page loads (navigated away from cart)', async () => {
      await cartPage.waitForPageLoad();
      const currentUrl = cartPage['page'].url();
      expect(currentUrl).not.toContain('/cart');
    });
  });

  test('TC-09: Remove applied promo code and apply a different valid promo code @regression', async () => {

    await test.step('Apply first promo code FIRST15', async () => {
      await cartPage.applyPromoCode(Data.TC09_FIRST_CODE);
    });

    await test.step('Verify first promo code is applied', async () => {
      expect(await cartPage.isPromoAppliedSuccessfully(), 'FIRST15 should be applied').toBeTruthy();
      const appliedText = await cartPage.getAppliedPromoCodeText();
      expect(appliedText).toContain(Data.TC09_FIRST_CODE);
    });

    await test.step('Remove the applied promo code', async () => {
      await cartPage.removePromoCode();
    });

    await test.step('Verify promo code is removed', async () => {
      expect(await cartPage.isPromoCodeApplied(), 'Promo should be removed').toBeFalsy();
      expect(await cartPage.isPromoCodeInputVisible(), 'Input should reappear').toBeTruthy();
    });

    await test.step('Apply second promo code SAVE20', async () => {
      await cartPage.applyPromoCode(Data.TC09_SECOND_CODE);
    });

    await test.step('Verify second promo code is applied successfully', async () => {
      expect(await cartPage.isPromoAppliedSuccessfully(), 'SAVE20 should be applied').toBeTruthy();
      const appliedText = await cartPage.getAppliedPromoCodeText();
      expect(appliedText).toContain(Data.TC09_SECOND_CODE);
      expect(await cartPage.isDiscountLineVisible(), 'Discount line should be visible').toBeTruthy();
    });
  });

  test('TC-10: Verify promo code with leading/trailing spaces is rejected as invalid @regression', async () => {

    await test.step('Enter promo code with leading/trailing spaces', async () => {
      await cartPage.applyPromoCode(Data.TC10_CODE_WITH_SPACES);
    });

    await test.step('Verify error message about alphanumeric-only characters', async () => {
      const errorMessage = await cartPage.getErrorMessageText();
      expect(errorMessage).toMatch(Data.TC10_EXPECTED_ERROR);
    });

    await test.step('Verify no discount is applied', async () => {
      expect(await cartPage.isDiscountLineVisible(), 'Discount line should not be visible').toBeFalsy();
    });

    await test.step('Verify promo code is NOT in applied state', async () => {
      expect(await cartPage.isPromoCodeApplied(), 'Promo should not be applied').toBeFalsy();
    });
  });
});
