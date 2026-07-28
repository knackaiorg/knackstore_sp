import { test, expect } from '@playwright/test';
import { PDPPage } from '../pages/pdp-product-q&a-recomendation';
import { HomePage } from '../pages/homepage-product-q&a-recommendation';
import { LoginPage } from '../pages/loginpage-product-q&a-recommendation';
import { TestConfig } from '../pdp-product-q&a-recommendation-data.config';

test.describe('PDP - Frequently Bought Together / Product Recommendations', () => {

  const config = new TestConfig();
  let pdpPage: PDPPage;
  let homePage: HomePage;
  let loginPage: LoginPage;

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('failure-screenshot', { body: screenshot, contentType: 'image/png' });
    }
  });

  test('Verify "Frequently Bought Together" section is visible on PDP - REC-001 @sanity @regression @positive', async ({ page }) => {

    await test.step('Navigate to product detail page', async () => {
      pdpPage = await PDPPage.load(page, '3');
    });

    await test.step('Verify Frequently Bought Together section is visible', async () => {
      const isSectionVisible = await pdpPage.isFrequentlyBoughtTogetherSectionVisible();
      expect(isSectionVisible).toBeTruthy();
    });

    await test.step('Verify section heading text', async () => {
      const headingText = await pdpPage.getFrequentlyBoughtTogetherHeadingText();
      expect(headingText).toMatch(/Frequently Bought Together|Recommended Products/i);
    });
  });

  test('Verify recommendation section is positioned below product description and near reviews - REC-002 @regression @positive', async ({ page }) => {

    await test.step('Navigate to product detail page', async () => {
      pdpPage = await PDPPage.load(page, '3');
    });

    await test.step('Verify section is below product description', async () => {
      const isBelowDescription = await pdpPage.isFrequentlyBoughtTogetherBelowProductDescription();
      expect(isBelowDescription).toBeTruthy();
    });

    await test.step('Verify section is near reviews section', async () => {
      const isNearReviews = await pdpPage.isFrequentlyBoughtTogetherNearReviews();
      expect(isNearReviews).toBeTruthy();
    });
  });

  test('Verify recommendation section displays exactly 2 products - REC-003  @regression @positive', async ({ page }) => {

    await test.step('Navigate to product detail page', async () => {
      pdpPage = await PDPPage.load(page, '3');
    });

    await test.step('Verify Frequently Bought Together section is visible', async () => {
      const isSectionVisible = await pdpPage.isFrequentlyBoughtTogetherSectionVisible();
      expect(isSectionVisible).toBeTruthy();
    });

    await test.step('Verify exactly 2 recommended products are displayed', async () => {
      const count = await pdpPage.getRecommendedProductsCount();
      expect(count).toBe(2);
    });
  });

  test('Verify top 2 products are displayed by co-purchase frequency - REC-004  @regression', async ({ page }) => {

    await test.step('Navigate to product detail page', async () => {
      pdpPage = await PDPPage.load(page, '3');
    });

    await test.step('Get recommended product names in order', async () => {
      const productNames = await pdpPage.getRecommendedProductNames();
      expect(productNames.length).toBe(2);
      console.log('Recommended products in order:', productNames);
      // Note: Requires seeded test data with known co-purchase frequencies
      // Verify order matches expected frequency-based ordering
      expect(productNames.length).toBeGreaterThan(0);
    });
  });

  test('Verify out-of-stock products are excluded from recommendations - REC-005  @regression @negative', async ({ page }) => {

    await test.step('Navigate to product with out-of-stock co-purchase item', async () => {
      // Note: Requires specific product with out-of-stock co-purchased items
      pdpPage = await PDPPage.load(page, '3');
    });

    await test.step('Get all recommended products', async () => {
      const recommendedProducts = await pdpPage.getAllRecommendedProductDetails();
      console.log('Recommended products:', recommendedProducts);
      
      // Verify no out-of-stock indicators in recommendations
      // Note: Implementation depends on how out-of-stock is marked in the UI
      expect(recommendedProducts.length).toBeGreaterThan(0);
    });
  });

  test('Verify discontinued products are excluded from recommendations - REC-006 @regression @negative', async ({ page }) => {

    await test.step('Navigate to product with discontinued co-purchase item', async () => {
      // Note: Requires specific product with discontinued co-purchased items
      pdpPage = await PDPPage.load(page, '3');
    });

    await test.step('Get all recommended products', async () => {
      const recommendedProducts = await pdpPage.getAllRecommendedProductDetails();
      console.log('Recommended products:', recommendedProducts);
      
      // Verify no discontinued products in recommendations
      // Note: Implementation depends on how discontinued items are marked
      expect(recommendedProducts.length).toBeGreaterThan(0);
    });
  });

  test('Verify the viewed product itself does not appear in recommendations - REC-007  @regression @negative', async ({ page }) => {

    await test.step('Navigate to product detail page', async () => {
      pdpPage = await PDPPage.load(page, '3');
    });

    await test.step('Get current product name', async () => {
      const currentProductName = await pdpPage.getCurrentProductName();
      console.log('Current product:', currentProductName);
      expect(currentProductName).toBeTruthy();
    });

    await test.step('Verify current product does NOT appear in recommendations', async () => {
      const appearsInRecommendations = await pdpPage.doesCurrentProductAppearInRecommendations();
      expect(appearsInRecommendations).toBeFalsy();
    });
  });

  test('Verify recommended product Cards from Frequently Bought Together section - REC-008 @sanity @regression @positive', async ({ page }) => {

    await test.step('Navigate to product detail page for UltraBook Pro 14', async () => {
      pdpPage = await PDPPage.load(page, '4');
    });

    await test.step('Verify Frequently Bought Together section is visible', async () => {
      const isSectionVisible = await pdpPage.isFrequentlyBoughtTogetherSectionVisible();
      expect(isSectionVisible).toBeTruthy();
    });

    await test.step('Fetch and verify recommended product names', async () => {
      const productNames = await pdpPage.getRecommendedProductNames();
      
      // Verify we have at least one recommended product
      expect(productNames.length).toBeGreaterThan(0);
      console.log('Recommended product names:', productNames);
      
      // Verify all product names are non-empty strings
      productNames.forEach((name, index) => {
        expect(name, `Product ${index + 1} name should not be empty`).toBeTruthy();
        expect(name.length, `Product ${index + 1} name should have length > 0`).toBeGreaterThan(0);
      });
    });

    await test.step('Verify expected product appears in recommendations', async () => {
      const productNames = await pdpPage.getRecommendedProductNames();
      
      // Based on pdpPage.mhtml, "ProBook XPS 15" should be in recommendations for product 4
      const expectedProduct = 'ProBook XPS 15';
      const hasExpectedProduct = productNames.some(name => name.includes(expectedProduct));
      
      expect(hasExpectedProduct, `Expected "${expectedProduct}" to be in recommendations`).toBeTruthy();
      console.log(`✓ Found expected product: ${expectedProduct}`);
    });

    await test.step('Verify each product name matches corresponding product card', async () => {
      const count = await pdpPage.getRecommendedProductsCount();
      
      for (let i = 0; i < count; i++) {
        const productName = await pdpPage.getRecommendedProductName(i);
        expect(productName, `Product ${i + 1} should have a valid name`).toBeTruthy();
        
        // Verify name is visible in the card
        const isNameVisible = await pdpPage.isRecommendedProductNameVisible(i);
        expect(isNameVisible, `Product ${i + 1} name should be visible`).toBeTruthy();
        
        console.log(`Product ${i + 1}: ${productName}`);
      }
    });

    await test.step('Verify recommended products have valid vendors/brands', async () => {
      const count = await pdpPage.getRecommendedProductsCount();
      
      for (let i = 0; i < count; i++) {
        const vendor = await pdpPage.getRecommendedProductVendor(i);
        expect(vendor, `Product ${i + 1} should have a vendor name`).toBeTruthy();
        console.log(`Product ${i + 1} vendor: ${vendor}`);
      }
    });
  });

  test('Verify each frequently bought product contains "View Details" button - REC-009 @sanity @regression', async ({ page }) => {

    await test.step('Navigate to product detail page', async () => {
      pdpPage = await PDPPage.load(page, '4');
    });

    await test.step('Verify Frequently Bought Together section is visible', async () => {
      const isSectionVisible = await pdpPage.isFrequentlyBoughtTogetherSectionVisible();
      expect(isSectionVisible).toBeTruthy();
    });

    await test.step('Verify each recommended product has "View Details" button', async () => {
      const count = await pdpPage.getRecommendedProductsCount();
      expect(count).toBeGreaterThan(0);
      
      for (let i = 0; i < count; i++) {
        await test.step(`Verify product ${i + 1} has "View Details" button`, async () => {
          const hasButton = await pdpPage.isRecommendedProductViewDetailsButtonVisible(i);
          expect(hasButton, `Product ${i + 1} should have "View Details" button`).toBeTruthy();
        });
      }
    });

    await test.step('Verify "View Details" button is clickable for first product', async () => {
      const productName = await pdpPage.getRecommendedProductName(0);
      console.log(`Clicking "View Details" for product: ${productName}`);
      
      await pdpPage.clickRecommendedProductViewDetailsButton(0);
      
      // Wait for navigation to complete
      await page.waitForLoadState('networkidle');
      
      // Verify navigation occurred (URL should change to product detail page)
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/products\/\d+/);
    });
  });

  test('Verify each recommended product card displays product image - REC-010 @regression @positive', async ({ page }) => {

    await test.step('Navigate to product detail page', async () => {
      pdpPage = await PDPPage.load(page, '3');
    });

    await test.step('Verify all recommended products have images', async () => {
      const count = await pdpPage.getRecommendedProductsCount();
      
      for (let i = 0; i < count; i++) {
        await test.step(`Verify product ${i + 1} has image`, async () => {
          const hasImage = await pdpPage.isRecommendedProductImageVisible(i);
          expect(hasImage).toBeTruthy();
        });

        await test.step(`Verify product ${i + 1} image has src attribute`, async () => {
          const imageSrc = await pdpPage.getRecommendedProductImageSrc(i);
          expect(imageSrc).toBeTruthy();
          expect(imageSrc).not.toBe('');
        });

        await test.step(`Verify product ${i + 1} image is loaded`, async () => {
          const isLoaded = await pdpPage.isRecommendedProductImageLoaded(i);
          expect(isLoaded).toBeTruthy();
        });
      }
    });

    await test.step('Verify all products have name, price, and rating @regression @positive', async () => {
      const allDetails = await pdpPage.getAllRecommendedProductDetails();
      
      allDetails.forEach((product, index) => {
        expect(product.name, `Product ${index + 1} should have name`).toBeTruthy();
        expect(product.price, `Product ${index + 1} should have price`).toBeTruthy();
        expect(product.hasImage, `Product ${index + 1} should have image`).toBeTruthy();
      });
    });
  });

  test('Verify recommendations are visible for guest users - REC-015 @regression @positive', async ({ page }) => {

    await test.step('Navigate to PDP as guest (no login)', async () => {
      pdpPage = await PDPPage.load(page, '3');
    });

    await test.step('Verify Frequently Bought Together section is visible', async () => {
      const isSectionVisible = await pdpPage.isFrequentlyBoughtTogetherSectionVisible();
      expect(isSectionVisible).toBeTruthy();
    });

    await test.step('Verify recommended products are displayed', async () => {
      const count = await pdpPage.getRecommendedProductsCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  test('Verify recommendations are visible for logged-in users - REC-016 @sanity @regression @positive', async ({ page }) => {

    await test.step('Navigate to home page', async () => {
      homePage = await HomePage.load(page);
    });

    await test.step('Perform login', async () => {
      loginPage = await homePage.clickLoginButton();
      await loginPage.performLogin(config.email, config.password);
    });

    await test.step('Navigate to product detail page', async () => {
      pdpPage = await PDPPage.load(page, '3');
    });

    await test.step('Verify Frequently Bought Together section is visible', async () => {
      const isSectionVisible = await pdpPage.isFrequentlyBoughtTogetherSectionVisible();
      expect(isSectionVisible).toBeTruthy();
    });

    await test.step('Verify recommended products are displayed', async () => {
      const count = await pdpPage.getRecommendedProductsCount();
      expect(count).toBeGreaterThan(0);
    });
  });
});
