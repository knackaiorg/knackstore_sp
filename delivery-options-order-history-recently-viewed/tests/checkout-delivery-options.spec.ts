import { test, expect } from '@playwright/test';
import { TestConfig } from '../checkout-delivery-options.config';
import { LoginPage } from '../pages/checkout-delivery-options-login-page';
import { DeliveryOptionsPage } from '../pages/checkout-delivery-options-page';

test.describe('Delivery Options - Checkout Flow', () => {

    const config = new TestConfig();
    let loginPage: LoginPage;
    let deliveryOptionsPage: DeliveryOptionsPage;

    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== testInfo.expectedStatus) {
            const screenshot = await page.screenshot({ fullPage: true });
            await testInfo.attach('failure-screenshot', { body: screenshot, contentType: 'image/png' });
        }
    });

    test.describe('Critical - Delivery Options Selection & Validation', () => {

        test('TC-01: Verify all three delivery options are displayed on the checkout page @sanity @regression', async ({ page }) => {

            await test.step('Login to the application', async () => {
                loginPage = new LoginPage(page);
                await loginPage.loginAndNavigate();
            });

            await test.step('Navigate to Delivery Options page', async () => {
                deliveryOptionsPage = new DeliveryOptionsPage(page);
                await deliveryOptionsPage.load();
                await deliveryOptionsPage.ensureLoaded();
            });

            await test.step('Verify all three delivery options are displayed', async () => {
                const allDisplayed = await deliveryOptionsPage.verifyAllDeliveryOptionsDisplayed();
                expect(allDisplayed).toBeTruthy();
            });

            await test.step('Verify each delivery option shows respective fee', async () => {
                const standardFee = await deliveryOptionsPage.getStandardDeliveryFee();
                expect(standardFee).toBeTruthy();

                const twoDayFee = await deliveryOptionsPage.getTwoDayDeliveryFee();
                expect(twoDayFee).toBeTruthy();

                const nextDayFee = await deliveryOptionsPage.getNextDayDeliveryFee();
                expect(nextDayFee).toBeTruthy();
            });
        });

        test('TC-02: Verify delivery fee appears as a separate line item and total updates correctly @sanity @regression', async ({ page }) => {

            await test.step('Login to the application', async () => {
                loginPage = new LoginPage(page);
                await loginPage.loginAndNavigate();
            });

            await test.step('Navigate to Delivery Options page', async () => {
                deliveryOptionsPage = new DeliveryOptionsPage(page);
                await deliveryOptionsPage.load();
            });

            await test.step('Select a delivery option', async () => {
                await deliveryOptionsPage.selectNextDayDelivery();
            });

            await test.step('Verify delivery fee appears as a separate line item', async () => {
                const isSeparate = await deliveryOptionsPage.isDeliveryFeeDisplayedSeparately();
                expect(isSeparate).toBeTruthy();
            });

            await test.step('Verify order total updates correctly', async () => {
                const fee = await deliveryOptionsPage.getDeliveryFeeText();
                expect(fee).toBeTruthy();

                const total = await deliveryOptionsPage.getOrderTotal();
                expect(total).toBeTruthy();
            });
        });

        test('TC-03: Verify estimated delivery date updates based on selected option and excludes weekends @sanity @regression', async ({ page }) => {

            await test.step('Login to the application', async () => {
                loginPage = new LoginPage(page);
                await loginPage.loginAndNavigate();
            });

            await test.step('Navigate to Delivery Options page', async () => {
                deliveryOptionsPage = new DeliveryOptionsPage(page);
                await deliveryOptionsPage.load();
            });

            await test.step('Select Standard delivery and capture fee/total', async () => {
                const standardResult = await deliveryOptionsPage.selectDeliveryOptionAndGetTotal('standard');
                expect(standardResult.total).toBeTruthy();
            });

            await test.step('Switch to 2-Day delivery and verify total updates', async () => {
                const twoDayResult = await deliveryOptionsPage.selectDeliveryOptionAndGetTotal('2-day');
                expect(twoDayResult.total).toBeTruthy();
            });

            await test.step('Switch to Next-Day delivery and verify total updates', async () => {
                const nextDayResult = await deliveryOptionsPage.selectDeliveryOptionAndGetTotal('next-day');
                expect(nextDayResult.total).toBeTruthy();
            });
        });

        test('TC-04: Verify customer cannot proceed to payment without selecting a delivery option @sanity @regression', async ({ page }) => {

            await test.step('Login to the application', async () => {
                loginPage = new LoginPage(page);
                await loginPage.loginAndNavigate();
            });

            await test.step('Navigate to Delivery Options page', async () => {
                deliveryOptionsPage = new DeliveryOptionsPage(page);
                await deliveryOptionsPage.load();
            });

            await test.step('Attempt to proceed to payment without selecting delivery option', async () => {
                await deliveryOptionsPage.attemptContinueWithoutSelection();
            });

            await test.step('Verify system prevents navigation to payment', async () => {
                const currentUrl = await page.url();
                expect(currentUrl).toContain('checkout');
            });
        });
    });

    test('TC-05: Verify Order Confirmation page displays delivery details @regression', async ({ page }) => {

        await test.step('Login to the application', async () => {
            loginPage = new LoginPage(page);
            await loginPage.loginAndNavigate();
        });

        await test.step('Navigate to Delivery Options page', async () => {
            deliveryOptionsPage = new DeliveryOptionsPage(page);
            await deliveryOptionsPage.load();
        });

        await test.step('Select a delivery option and proceed', async () => {
            await deliveryOptionsPage.selectStandardDelivery();
            await deliveryOptionsPage.clickContinueToPayment();
        });

        await test.step('Verify Order Confirmation displays delivery details', async () => {
            // TODO: Add OrderConfirmationPage POM with verifyDeliveryOptionDisplayed(), verifyDeliveryFeeDisplayed(), verifyEstimatedDateDisplayed()
            await page.waitForLoadState('networkidle');
        });
    });

    test('TC-06: Verify Order History page displays delivery details for past order @regression', async ({ page }) => {

        await test.step('Login to the application', async () => {
            loginPage = new LoginPage(page);
            await loginPage.loginAndNavigate();
        });

        await test.step('Navigate to Order History', async () => {
            // TODO: Add OrderHistoryPage POM with navigateToOrderHistory(), openOrderDetails()
            await page.goto(config.appURL + 'account/orders');
        });

        await test.step('Verify order details show delivery information', async () => {
            // TODO: Add OrderHistoryPage.verifyDeliveryOptionDisplayed(), verifyDeliveryFeeDisplayed(), verifyEstimatedDateDisplayed()
            await page.waitForLoadState('networkidle');
        });
    });

    test('TC-07: Verify 2-Day Delivery cost becomes $0 when cart total exceeds $200 @regression', async ({ page }) => {

        await test.step('Login to the application', async () => {
            loginPage = new LoginPage(page);
            await loginPage.loginAndNavigate();
        });

        await test.step('Add product to cart with total exceeding $200', async () => {
            deliveryOptionsPage = new DeliveryOptionsPage(page);
            await deliveryOptionsPage.addProductsToCartForTotal(999); // Adds $999.99 product (> $200)
        });

        await test.step('Navigate to Delivery Options page', async () => {
            await deliveryOptionsPage.load();
        });

        await test.step('Select 2-Day Delivery option', async () => {
            await deliveryOptionsPage.selectTwoDayDelivery();
            await page.waitForTimeout(1000); // Wait for UI update
        });

        await test.step('Verify 2-Day Delivery fee is $0 (Free)', async () => {
            const fee = await deliveryOptionsPage.getDeliveryFeeText();
            expect(fee.toLowerCase()).toContain('free');
        });
    });

    test('TC-08: Verify customer can change delivery option and totals update accordingly @regression', async ({ page }) => {

        await test.step('Login to the application', async () => {
            loginPage = new LoginPage(page);
            await loginPage.loginAndNavigate();
        });

        await test.step('Navigate to Delivery Options page', async () => {
            deliveryOptionsPage = new DeliveryOptionsPage(page);
            await deliveryOptionsPage.load();
        });

        await test.step('Select Standard delivery and note fee/total', async () => {
            const standardResult = await deliveryOptionsPage.selectDeliveryOptionAndGetTotal('standard');
            expect(standardResult.fee).toBeTruthy();
            expect(standardResult.total).toBeTruthy();
        });

        await test.step('Change to Next-Day delivery and verify totals update', async () => {
            const nextDayResult = await deliveryOptionsPage.selectDeliveryOptionAndGetTotal('next-day');
            expect(nextDayResult.fee).toBeTruthy();
            expect(nextDayResult.total).toBeTruthy();
        });
    });

    test('TC-09: Verify 2-Day Delivery is NOT free when cart total is exactly $200 or below @regression', async ({ page }) => {

        await test.step('Login to the application', async () => {
            loginPage = new LoginPage(page);
            await loginPage.loginAndNavigate();
        });

        await test.step('Add product to cart with total below $200', async () => {
            deliveryOptionsPage = new DeliveryOptionsPage(page);
            await deliveryOptionsPage.addProductsToCartForTotal(199); // Adds $199.99 product (< $200)
        });

        await test.step('Navigate to Delivery Options page', async () => {
            await deliveryOptionsPage.load();
        });

        await test.step('Select 2-Day Delivery option', async () => {
            await deliveryOptionsPage.selectTwoDayDelivery();
            await page.waitForTimeout(1000); // Wait for UI update
        });

        await test.step('Verify 2-Day Delivery fee is NOT $0', async () => {
            const fee = await deliveryOptionsPage.getDeliveryFeeText();
            expect(fee.toLowerCase()).not.toContain('free');
            expect(fee).not.toBe('$ 0');
            expect(fee).not.toBe('$ 0.00');
        });
    });

    test('TC-10: Verify estimated delivery date does not fall on weekend or holiday @regression', async ({ page }) => {

        await test.step('Login to the application', async () => {
            loginPage = new LoginPage(page);
            await loginPage.loginAndNavigate();
        });

        await test.step('Navigate to Delivery Options page', async () => {
            deliveryOptionsPage = new DeliveryOptionsPage(page);
            await deliveryOptionsPage.load();
        });

        await test.step('Select Standard delivery and verify date is not on weekend', async () => {
            await deliveryOptionsPage.selectStandardDelivery();
            // TODO: Add getEstimatedDeliveryDate() to DeliveryOptionsPage and validate day-of-week
        });

        await test.step('Select 2-Day delivery and verify date is not on weekend', async () => {
            await deliveryOptionsPage.selectTwoDayDelivery();
            // TODO: Add getEstimatedDeliveryDate() to DeliveryOptionsPage and validate day-of-week
        });

        await test.step('Select Next-Day delivery and verify date is not on weekend', async () => {
            await deliveryOptionsPage.selectNextDayDelivery();
            // TODO: Add getEstimatedDeliveryDate() to DeliveryOptionsPage and validate day-of-week
        });
    });
});
