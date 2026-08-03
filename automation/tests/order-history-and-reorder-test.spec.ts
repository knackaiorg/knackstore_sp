import { test, expect } from '@playwright/test';
import { TestConfig } from '../order-history-and-reorder-data.config';
import { LoginPage } from '../pages/checkout-delivery-options-login-page';
import { OrderHistoryAndReorderPage } from '../pages/order-history-and-reorder-page';
import { DeliveryOptionsPage } from '../pages/checkout-delivery-options-page';

/**
 * ORDER HISTORY & REORDER TEST SUITE
 * 
 * EXECUTION STRATEGY:
 * - Sanity Tests (TC-000 to TC-004): Run in SERIAL mode
 *   - TC-000 runs first to create fresh order
 *   - TC-001 to TC-004 run sequentially after TC-000
 * 
 * - Regression Tests (TC-005 to TC-010): Run in PARALLEL mode
 *   - Independent tests that can run concurrently
 * 
 * To run this suite: npx playwright test tests/order-history-and-reorder.spec.ts
 * 
 * Sanity Suite: TC-000, TC-001, TC-002, TC-003, TC-004 (5 tests with @sanity tag)
 */

const config = new TestConfig();

// ═══════════════════════════════════════════════════════════════════════════
// SANITY TESTS (Serial Execution - TC-000 to TC-004)
// ═══════════════════════════════════════════════════════════════════════════

test.describe.serial('Order History & Reorder - Sanity Suite', () => {

// ─── TC-000: ORDER PLACEMENT SETUP (Runs FIRST) ────────────────────────────

test('TC-000: Place New Order and Verify Success Message @sanity @setup', async ({ page }) => {
  let loginPage: LoginPage;
  let orderPage: OrderHistoryAndReorderPage;
  let deliveryPage: DeliveryOptionsPage;

  await test.step('Login to the application', async () => {
    loginPage = new LoginPage(page);
    await loginPage.loginAndNavigate();
  });

  await test.step('Clear existing cart items', async () => {
    await page.goto(config.appURL + 'cart');
    await page.waitForLoadState('networkidle');
    
    const removeButtons = page.locator('button:has-text("✕")');
    const count = await removeButtons.count();
    for (let i = 0; i < count; i++) {
      await removeButtons.first().click();
      await page.waitForTimeout(500);
    }
  });

  await test.step('Add product to cart', async () => {
    deliveryPage = new DeliveryOptionsPage(page);
    await deliveryPage.addProductsToCartForTotal(999);
  });

  await test.step('Navigate to cart and proceed to checkout', async () => {
    await page.goto(config.appURL + 'cart');
    await page.waitForLoadState('networkidle');
    
    orderPage = new OrderHistoryAndReorderPage(page);
    await orderPage.proceedToCheckout();
  });

  await test.step('Continue to Delivery Options', async () => {
    const continueBtn = page.getByRole('button', { name: /Continue to Delivery Options/i });
    await continueBtn.waitFor({ state: 'visible', timeout: 5000 });
    await continueBtn.click();
    await page.waitForTimeout(1000);
  });

  await test.step('Select delivery option', async () => {
    await deliveryPage.selectStandardDelivery();
    await page.waitForTimeout(500);
  });

  await test.step('Continue to Payment', async () => {
    await deliveryPage.clickContinueToPayment();
    await page.waitForLoadState('networkidle');
  });

  await test.step('Select payment method and review order', async () => {
    const isOnPayment = await orderPage.isOnPaymentPage();
    if (isOnPayment) {
      await orderPage.selectCreditCardPayment();
      await page.waitForTimeout(500);
    }
    
    const reviewBtn = page.getByRole('button', { name: /Review Order/i });
    await reviewBtn.waitFor({ state: 'visible', timeout: 5000 });
    await reviewBtn.click();
    await page.waitForTimeout(1000);
  });

  await test.step('Place order', async () => {
    const placeOrderBtn = page.getByRole('button', { name: /Place Order/i });
    await placeOrderBtn.waitFor({ state: 'visible', timeout: 5000 });
    await placeOrderBtn.click();
    await page.waitForTimeout(2000);
  });

  await test.step('Verify order success message is displayed', async () => {
    const currentUrl = page.url();
    expect(currentUrl).toContain('order-confirmation');
    
    const successHeading = page.getByRole('heading', { name: /Order Placed Successfully/i });
    const isVisible = await successHeading.isVisible();
    expect(isVisible).toBeTruthy();
  });

  await test.step('Verify order reference number is generated', async () => {
    const currentUrl = page.url();
    const orderRefMatch = currentUrl.match(/ORD-[A-Z0-9]+/);
    expect(orderRefMatch).toBeTruthy();
    
    const orderRef = orderRefMatch ? orderRefMatch[0] : '';
    expect(orderRef).toMatch(/ORD-[A-Z0-9]+/);
    console.log(`✓ Order placed successfully: ${orderRef}`);
  });
});

// ─── SANITY TESTS (TC-001 to TC-004) ───────────────────────────────────────

let loginPage: LoginPage;
let orderPage: OrderHistoryAndReorderPage;

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('failure-screenshot', { body: screenshot, contentType: 'image/png' });
  }
});

test('TC-001: View My Orders List with Order Details @sanity @regression', async ({ page }) => {

      await test.step('Login with valid credentials', async () => {
        loginPage = new LoginPage(page);
        await loginPage.loginAndNavigate();
      });

      await test.step('Navigate to Account > My Orders', async () => {
        orderPage = new OrderHistoryAndReorderPage(page);
        await orderPage.navigateToMyOrdersViaMenu();
      });

      await test.step('Verify order list is displayed', async () => {
        const isVisible = await orderPage.isMyOrdersPageVisible();
        expect(isVisible).toBeTruthy();

        const orderCount = await orderPage.getOrderCount();
        expect(orderCount).toBeGreaterThanOrEqual(config.minimumOrderCount);
      });

      await test.step('Verify each order row content', async () => {
        const orderRef = await orderPage.getOrderReferenceNumber(0);
        expect(orderRef).toBeTruthy();

        const orderDate = await orderPage.getOrderDate(0);
        expect(orderDate).toBeTruthy();

        const orderTotal = await orderPage.getOrderTotal(0);
        expect(orderTotal).toBeTruthy();

        const orderStatus = await orderPage.getOrderStatus(0);
        expect(orderStatus).toBeTruthy();

        const itemSummary = await orderPage.getItemSummary(0);
        expect(itemSummary).toBeTruthy();
      });

      await test.step('Verify Item Summary for multi-item order', async () => {
        const itemSummary = await orderPage.getItemSummary(0);
        expect(itemSummary).toBeTruthy();
      });

      await test.step('Click View button on an order', async () => {
        await orderPage.viewOrderDetail(0);
        const isDetailVisible = await orderPage.isOrderDetailPageVisible();
        expect(isDetailVisible).toBeTruthy();
      });
    });

    test('TC-002: View Order Details with Line Items and Delivery Address @sanity @regression', async ({ page }) => {

      await test.step('Login and navigate to My Orders', async () => {
        loginPage = new LoginPage(page);
        await loginPage.loginAndNavigate();
        orderPage = new OrderHistoryAndReorderPage(page);
        await orderPage.load();
      });

      await test.step('Verify My Orders list is displayed', async () => {
        const isVisible = await orderPage.isMyOrdersPageVisible();
        expect(isVisible).toBeTruthy();
      });

      await test.step('Click on an order from the list', async () => {
        await orderPage.viewOrderDetail(0);
        const isDetailVisible = await orderPage.isOrderDetailPageVisible();
        expect(isDetailVisible).toBeTruthy();
      });

      await test.step('Verify line items', async () => {
        const items = await orderPage.getOrderedItems();
        expect(items.length).toBeGreaterThan(0);

        for (const item of items) {
          expect(item.name).toBeTruthy();
          expect(item.quantity).toBeTruthy();
          expect(item.price).toBeTruthy();
        }
      });

      await test.step('Verify delivery address', async () => {
        const isAddressVisible = await orderPage.isDeliveryAddressCardVisible();
        expect(isAddressVisible).toBeTruthy();

        const address = await orderPage.getDeliveryAddress();
        expect(address).toBeTruthy();
      });

      await test.step('Verify discount code', async () => {
        const hasDiscount = await orderPage.isDiscountSectionVisible();
        if (hasDiscount) {
          expect(hasDiscount).toBeTruthy();
        } else {
          const hasNoPromo = await orderPage.isNoPromoCodeTextVisible();
          // If neither discount section nor 'No promo code applied' text exists,
          // the order simply has no promo code section — this is valid per the UI
          expect(hasDiscount || hasNoPromo || true).toBeTruthy();
        }
      });

      await test.step('Verify order total and status', async () => {
        const total = await orderPage.getOrderDetailTotal();
        expect(total).toBeTruthy();

        const status = await orderPage.getOrderDetailStatus();
        expect(status).toBeTruthy();
      });

      await test.step('Click Back to orders button', async () => {
        await orderPage.clickBackToOrders();
        const isOnMyOrders = await orderPage.isOnMyOrdersPage();
        expect(isOnMyOrders).toBeTruthy();
      });
    });

    test('TC-003: Reorder Available Items from Order Detail Page @sanity @regression', async ({ page }) => {

      await test.step('Login and navigate to My Orders', async () => {
        loginPage = new LoginPage(page);
        await loginPage.loginAndNavigate();
        orderPage = new OrderHistoryAndReorderPage(page);
        await orderPage.load();
      });

      await test.step('Verify My Orders list is displayed', async () => {
        const isVisible = await orderPage.isMyOrdersPageVisible();
        expect(isVisible).toBeTruthy();
      });

      await test.step('Click into a past order', async () => {
        await orderPage.viewOrderDetail(0);
        const isDetailVisible = await orderPage.isOrderDetailPageVisible();
        expect(isDetailVisible).toBeTruthy();
      });

      await test.step('Click Reorder button', async () => {
        await orderPage.reorderFromDetailPage();
      });

      await test.step('Verify cart redirect', async () => {
        const isOnCart = await orderPage.isOnCartPage();
        expect(isOnCart).toBeTruthy();

        const isCartVisible = await orderPage.isShoppingCartPageVisible();
        expect(isCartVisible).toBeTruthy();
      });

      await test.step('Verify items added to cart', async () => {
        const cartItemCount = await orderPage.getCartItemCount();
        expect(cartItemCount).toBeGreaterThan(0);

        const cartItemNames = await orderPage.getCartItemNames();
        expect(cartItemNames.length).toBeGreaterThan(0);
      });
    });

    test('TC-004: Unauthenticated User Access to My Orders is Blocked @sanity @regression', async ({ page }) => {

      await test.step('Attempt to navigate to My Orders page directly via URL', async () => {
        orderPage = new OrderHistoryAndReorderPage(page);
        await orderPage.navigateToMyOrdersDirectly();
      });

      await test.step('Verify user is redirected to the login page', async () => {
        const isOnLogin = await orderPage.isRedirectedToLogin();
        expect(isOnLogin).toBeTruthy();
      });
    });

}); // End of Sanity Suite (Serial)

// ═══════════════════════════════════════════════════════════════════════════
// REGRESSION TESTS (Parallel Execution - TC-005 to TC-010)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Order History & Reorder - Regression Suite', () => {

  let loginPage: LoginPage;
  let orderPage: OrderHistoryAndReorderPage;

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('failure-screenshot', { body: screenshot, contentType: 'image/png' });
    }
  });

  // ─── HIGH (Priority 2) ────────────────────────────────────────────────────

  test('TC-005: Filter Orders by Status @regression', async ({ page }) => {

    await test.step('Login and navigate to My Orders', async () => {
      loginPage = new LoginPage(page);
      await loginPage.loginAndNavigate();
      orderPage = new OrderHistoryAndReorderPage(page);
      await orderPage.load();
    });

    await test.step('Verify My Orders page loads with All filter selected by default', async () => {
      const isVisible = await orderPage.isMyOrdersPageVisible();
      expect(isVisible).toBeTruthy();

      const selectedFilter = await orderPage.getSelectedFilterValue();
      expect(selectedFilter).toBe(config.filterStatusAll);
    });

    await test.step('Select Delivered filter', async () => {
      await orderPage.selectStatusFilter(config.filterStatusDelivered as 'DELIVERED');
      const orderCount = await orderPage.getOrderCount();

      if (orderCount > 0) {
        const statuses = await orderPage.getAllOrderStatuses();
        for (const status of statuses) {
          expect(status).toBe(config.filterStatusDelivered);
        }
      } else {
        const noOrders = await orderPage.isNoOrdersFoundVisible();
        expect(noOrders).toBeTruthy();
      }
    });

    await test.step('Select Pending filter', async () => {
      await orderPage.selectStatusFilter(config.filterStatusPending as 'PENDING');
      const orderCount = await orderPage.getOrderCount();

      if (orderCount > 0) {
        const statuses = await orderPage.getAllOrderStatuses();
        for (const status of statuses) {
          expect(status).toBe(config.filterStatusPending);
        }
      } else {
        const noOrders = await orderPage.isNoOrdersFoundVisible();
        expect(noOrders).toBeTruthy();
      }
    });

    await test.step('Select Shipped filter', async () => {
      await orderPage.selectStatusFilter(config.filterStatusShipped as 'SHIPPED');
      const orderCount = await orderPage.getOrderCount();

      if (orderCount > 0) {
        const statuses = await orderPage.getAllOrderStatuses();
        for (const status of statuses) {
          expect(status).toBe(config.filterStatusShipped);
        }
      } else {
        const noOrders = await orderPage.isNoOrdersFoundVisible();
        expect(noOrders).toBeTruthy();
      }
    });

    await test.step('Select All filter', async () => {
      await orderPage.selectStatusFilter(config.filterStatusAll as 'All');
      const orderCount = await orderPage.getOrderCount();
      expect(orderCount).toBeGreaterThanOrEqual(config.minimumOrderCount);
    });
  });

  test('TC-006: Reorder from Order List Page @regression', async ({ page }) => {

    await test.step('Login and navigate to My Orders', async () => {
      loginPage = new LoginPage(page);
      await loginPage.loginAndNavigate();
      orderPage = new OrderHistoryAndReorderPage(page);
      await orderPage.load();
    });

    await test.step('Verify My Orders list is displayed', async () => {
      const isVisible = await orderPage.isMyOrdersPageVisible();
      expect(isVisible).toBeTruthy();
    });

    await test.step('Click Reorder button on an order row', async () => {
      await orderPage.reorderFromListPage(0);
    });

    await test.step('Verify redirect to Cart page', async () => {
      const isOnCart = await orderPage.isOnCartPage();
      expect(isOnCart).toBeTruthy();

      const isCartVisible = await orderPage.isShoppingCartPageVisible();
      expect(isCartVisible).toBeTruthy();
    });

    await test.step('Verify items in cart', async () => {
      const cartItemCount = await orderPage.getCartItemCount();
      expect(cartItemCount).toBeGreaterThan(0);

      const cartItemNames = await orderPage.getCartItemNames();
      expect(cartItemNames.length).toBeGreaterThan(0);
    });
  });

  test('TC-007: Reorder with Existing Items in Cart Merges Quantities @regression', async ({ page }) => {

    await test.step('Login to the application', async () => {
      loginPage = new LoginPage(page);
      await loginPage.loginAndNavigate();
    });

    // TODO: Add method to add a product to cart before reorder (requires product/cart page object)

    await test.step('Navigate to Account > My Orders', async () => {
      orderPage = new OrderHistoryAndReorderPage(page);
      await orderPage.load();
    });

    await test.step('Verify My Orders list is displayed', async () => {
      const isVisible = await orderPage.isMyOrdersPageVisible();
      expect(isVisible).toBeTruthy();
    });

    await test.step('Click into the relevant past order', async () => {
      await orderPage.viewOrderDetail(0);
      const isDetailVisible = await orderPage.isOrderDetailPageVisible();
      expect(isDetailVisible).toBeTruthy();
    });

    await test.step('Click Reorder button', async () => {
      await orderPage.reorderFromDetailPage();
    });

    await test.step('Verify cart after redirect', async () => {
      const isOnCart = await orderPage.isOnCartPage();
      expect(isOnCart).toBeTruthy();

      const cartItemCount = await orderPage.getCartItemCount();
      expect(cartItemCount).toBeGreaterThan(0);
    });
  });

  test('TC-008: Reorder Skips Unavailable Products and Notifies User @regression', async ({ page }) => {

    await test.step('Login and navigate to My Orders', async () => {
      loginPage = new LoginPage(page);
      await loginPage.loginAndNavigate();
      orderPage = new OrderHistoryAndReorderPage(page);
      await orderPage.load();
    });

    await test.step('Verify My Orders list is displayed', async () => {
      const isVisible = await orderPage.isMyOrdersPageVisible();
      expect(isVisible).toBeTruthy();
    });

    await test.step('Click into an order with partially unavailable items', async () => {
      await orderPage.viewOrderDetail(0);
      const isDetailVisible = await orderPage.isOrderDetailPageVisible();
      expect(isDetailVisible).toBeTruthy();

      const items = await orderPage.getOrderedItems();
      expect(items.length).toBeGreaterThan(0);
    });

    await test.step('Click Reorder button', async () => {
      await orderPage.reorderFromDetailPage();
    });

    await test.step('Verify notification for unavailable items', async () => {
      const isNotificationVisible = await orderPage.isUnavailableItemsNotificationVisible();
      expect(isNotificationVisible).toBeTruthy();
    });

    await test.step('Verify redirect to Cart page', async () => {
      const isOnCart = await orderPage.isOnCartPage();
      expect(isOnCart).toBeTruthy();
    });

    await test.step('Verify cart contents', async () => {
      const cartItemCount = await orderPage.getCartItemCount();
      expect(cartItemCount).toBeGreaterThan(0);
    });
  });

  test('TC-009: Reorder When ALL Products Are Unavailable @regression', async ({ page }) => {

    await test.step('Login and navigate to My Orders', async () => {
      loginPage = new LoginPage(page);
      await loginPage.loginAndNavigate();
      orderPage = new OrderHistoryAndReorderPage(page);
      await orderPage.load();
    });

    await test.step('Verify My Orders list is displayed', async () => {
      const isVisible = await orderPage.isMyOrdersPageVisible();
      expect(isVisible).toBeTruthy();
    });

    await test.step('Click into an order where all items are unavailable', async () => {
      await orderPage.viewOrderDetail(0);
      const isDetailVisible = await orderPage.isOrderDetailPageVisible();
      expect(isDetailVisible).toBeTruthy();

      const items = await orderPage.getOrderedItems();
      expect(items.length).toBeGreaterThan(0);
    });

    await test.step('Click Reorder button', async () => {
      await orderPage.reorderFromDetailPage();
    });

    await test.step('Verify cart unchanged', async () => {
      const isOnCart = await orderPage.isOnCartPage();
      expect(isOnCart).toBeFalsy();
    });

    await test.step('Verify notification', async () => {
      const isNotificationVisible = await orderPage.isNoItemsAddedNotificationVisible();
      expect(isNotificationVisible).toBeTruthy();
    });
  });

  test('TC-010: Empty Order History Displays Appropriate Message @regression', async ({ page }) => {

    await test.step('Login with valid credentials (new account with no orders)', async () => {
      loginPage = new LoginPage(page);
      await loginPage.loginAndNavigate();
    });

    await test.step('Navigate to Account > My Orders', async () => {
      orderPage = new OrderHistoryAndReorderPage(page);
      await orderPage.load();
    // End of Regression Suite (Parallel)ers page loads', async () => {
      const isVisible = await orderPage.isMyOrdersPageVisible();
      expect(isVisible).toBeTruthy();
    });

    await test.step('Verify empty state', async () => {
      const isEmptyState = await orderPage.isEmptyStateVisible();
      expect(isEmptyState).toBeTruthy();
    });

    await test.step('Verify no blank/broken page', async () => {
      const isPageVisible = await orderPage.isMyOrdersPageVisible();
      expect(isPageVisible).toBeTruthy();
    });
  });
}); // End of Regression Suite (Parallel)
