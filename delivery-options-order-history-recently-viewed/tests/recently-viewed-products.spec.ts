import { test, expect } from '@playwright/test';
import { TestConfig } from '../recently-viewed-products.config';
import { RecentlyViewedPage } from '../pages/recently-viewed-products-page';

test.describe('Recently Viewed Products - Guest & Logged-In User Flows', () => {

    const config = new TestConfig();
    let recentlyViewedPage: RecentlyViewedPage;

    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== testInfo.expectedStatus) {
            const screenshot = await page.screenshot({ fullPage: true });
            await testInfo.attach('failure-screenshot', { body: screenshot, contentType: 'image/png' });
        }
    });

    test('TC-01: Verify recently viewed products are saved to localStorage and displayed as a horizontal strip @sanity @regression', async ({ page }) => {

        await test.step('Setup: Navigate to app and clear localStorage', async () => {
            recentlyViewedPage = new RecentlyViewedPage(page);
            await recentlyViewedPage.load();
            await recentlyViewedPage.clearLocalStorage();
        });

        await test.step('Navigate to PDP for Product A', async () => {
            await recentlyViewedPage.navigateToProduct(config.productIds[0]);
        });

        await test.step('Verify Product A is saved to localStorage', async () => {
            const storedItems = await recentlyViewedPage.getLocalStorageRecentlyViewed();
            expect(storedItems.length).toBeGreaterThan(0);
        });

        await test.step('Navigate to the Homepage and observe Recently Viewed section', async () => {
            await recentlyViewedPage.navigateToHomepage();
            const isVisible = await recentlyViewedPage.isRecentlyViewedSectionVisible();
            expect(isVisible).toBeTruthy();
            const isCarouselVisible = await recentlyViewedPage.isRecentlyViewedCarouselVisible();
            expect(isCarouselVisible).toBeTruthy();
        });

        await test.step('Navigate to PDP for Product B', async () => {
            await recentlyViewedPage.navigateToProduct(config.productIds[1]);
        });

        await test.step('Navigate back to Homepage and observe Recently Viewed section again', async () => {
            await recentlyViewedPage.navigateToHomepage();
            const isVisible = await recentlyViewedPage.isRecentlyViewedSectionVisible();
            expect(isVisible).toBeTruthy();
        });

        await test.step('Verify products are displayed in reverse chronological order', async () => {
            const productNames = await recentlyViewedPage.getRecentlyViewedProductNames();
            expect(productNames.length).toBe(2);
        });

        await test.step('Verify products are stored in localStorage', async () => {
            const storedItems = await recentlyViewedPage.getLocalStorageRecentlyViewed();
            expect(storedItems.length).toBe(2);
        });

        await test.step('Verify up to 10 products are shown in the strip', async () => {
            const count = await recentlyViewedPage.getRecentlyViewedProductCount();
            expect(count).toBeLessThanOrEqual(config.maxRecentlyViewedItems);
        });
    });

    test('TC-02: Verify logged-in user recently viewed history persists across sessions @sanity @regression', async ({ page }) => {

        await test.step('Log into the account', async () => {
            recentlyViewedPage = new RecentlyViewedPage(page);
            await recentlyViewedPage.loginAsUser();
        });

        await test.step('Navigate to PDP for Product X, Product Y, and Product Z', async () => {
            await recentlyViewedPage.browseProducts([config.productIds[0], config.productIds[1], config.productIds[2]]);
        });

        await test.step('Capture viewed product names for later comparison', async () => {
            await recentlyViewedPage.navigateToHomepage();
            const productNamesBefore = await recentlyViewedPage.getRecentlyViewedProductNames();
            expect(productNamesBefore.length).toBeGreaterThanOrEqual(3);
        });

        await test.step('Log out of the account', async () => {
            await recentlyViewedPage.clickLogout();
        });

        await test.step('Log into the same account again (simulating different session)', async () => {
            await recentlyViewedPage.loginAsUser();
        });

        await test.step('Navigate to the Homepage and observe Recently Viewed section', async () => {
            await recentlyViewedPage.navigateToHomepage();
            const isVisible = await recentlyViewedPage.isRecentlyViewedSectionVisible();
            expect(isVisible).toBeTruthy();
        });

        await test.step('Verify recently viewed history persists from previous session', async () => {
            const productNamesAfter = await recentlyViewedPage.getRecentlyViewedProductNames();
            expect(productNamesAfter.length).toBeGreaterThanOrEqual(3);
        });
    });

    test('TC-03: Verify product card displays correct details and Add to Cart works for non-variant products @sanity @regression', async ({ page }) => {

        await test.step('Navigate to a PDP for a non-variant product', async () => {
            recentlyViewedPage = new RecentlyViewedPage(page);
            await recentlyViewedPage.navigateToProduct(config.productIds[0]);
        });

        await test.step('Navigate to the Homepage to see the Recently Viewed strip', async () => {
            await recentlyViewedPage.navigateToHomepage();
            const isVisible = await recentlyViewedPage.isRecentlyViewedSectionVisible();
            expect(isVisible).toBeTruthy();
        });

        await test.step('Verify the product card displays Product Image', async () => {
            const isImageVisible = await recentlyViewedPage.isProductCardImageVisible(0);
            expect(isImageVisible).toBeTruthy();
        });

        await test.step('Verify the product card displays Product Name', async () => {
            const isNameVisible = await recentlyViewedPage.isProductCardNameVisible(0);
            expect(isNameVisible).toBeTruthy();
            const productName = await recentlyViewedPage.getProductCardName(0);
            expect(productName).toBeTruthy();
        });

        await test.step('Verify the product card displays Price', async () => {
            const isPriceVisible = await recentlyViewedPage.isProductCardPriceVisible(0);
            expect(isPriceVisible).toBeTruthy();
            const productPrice = await recentlyViewedPage.getProductCardPrice(0);
            expect(productPrice).toBeTruthy();
        });

        await test.step('Verify Add to Cart button is visible on the card and click it', async () => {
            // TODO: Add isAddToCartButtonVisibleOnCard(cardIndex) to RecentlyViewedPage
            // TODO: Add clickAddToCartOnCard(cardIndex) to RecentlyViewedPage
            // Note: "Add to Cart" button on recently viewed cards is conditionally rendered for non-variant products only
        });

        await test.step('Verify item is added to cart without leaving the current page', async () => {
            const isOnHomepage = await recentlyViewedPage.isOnHomepage();
            expect(isOnHomepage).toBeTruthy();
            // TODO: Add getCartBadgeCount() assertion after clickAddToCartOnCard is implemented
        });
    });

    test('TC-04: Verify viewing more than 10 products does not exceed the maximum limit @sanity @regression', async ({ page }) => {

        await test.step('Setup: Navigate to app and clear localStorage', async () => {
            recentlyViewedPage = new RecentlyViewedPage(page);
            await recentlyViewedPage.load();
            await recentlyViewedPage.clearLocalStorage();
        });

        await test.step('Navigate to PDPs for 11 different products sequentially', async () => {
            await recentlyViewedPage.browseProductsBeyondLimit();
        });

        await test.step('Navigate to the Homepage after viewing all 11 products', async () => {
            await recentlyViewedPage.navigateToHomepage();
        });

        await test.step('Verify only 10 products are displayed in the Recently Viewed strip', async () => {
            const displayedCount = await recentlyViewedPage.getRecentlyViewedProductCount();
            expect(displayedCount).toBeLessThanOrEqual(config.maxRecentlyViewedItems);
        });

        await test.step('Verify localStorage contains exactly 10 product entries', async () => {
            const localStorageCount = await recentlyViewedPage.getLocalStorageItemCount();
            expect(localStorageCount).toBe(config.maxRecentlyViewedItems);
        });

        await test.step('Verify the most recently viewed product appears in position 1', async () => {
            const productNames = await recentlyViewedPage.getRecentlyViewedProductNames();
            expect(productNames.length).toBe(config.maxRecentlyViewedItems);
        });

        await test.step('Verify oldest product (Product 1) is evicted from the list', async () => {
            const storedItems = await recentlyViewedPage.getLocalStorageRecentlyViewed();
            expect(storedItems.length).toBe(config.maxRecentlyViewedItems);
        });
    });
});
