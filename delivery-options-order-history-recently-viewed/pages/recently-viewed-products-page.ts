import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base-pages/BasePage';
import { TestConfig } from '../recently-viewed-products.config';

/**
 * Page Object for Recently Viewed Products feature.
 * Covers: Homepage and Product Detail Page (PDP) recently viewed carousel,
 * product card interactions, and localStorage verification.
 * Mapped to test cases: TC-01 through TC-04.
 */
export class RecentlyViewedPage extends BasePage {

  private readonly config = new TestConfig();

  // ─── Private Locators: Recently Viewed Section ────────────────────────────────
  // Source: recently-viewed-homepage.mhtml, recently-viewed-pdp.mhtml

  private readonly recentlyViewedHeading: Locator = this.page.getByRole('heading', { name: 'Recently Viewed Products' });
  private readonly recentlyViewedCarousel: Locator = this.page.locator('app-recently-viewed-products');
  private readonly carouselSection: Locator = this.page.locator('.product-carousel-section');
  private readonly carouselTrack: Locator = this.page.locator('app-recently-viewed-products .carousel-track');
  private readonly carouselItems: Locator = this.page.locator('app-recently-viewed-products .carousel-item-wrapper');

  // ─── Private Locators: Product Card Elements ──────────────────────────────────

  private readonly productCards: Locator = this.page.locator('app-recently-viewed-products app-product-card');
  private readonly productCardImages: Locator = this.page.locator('app-recently-viewed-products app-product-card .card-img-top');
  private readonly productCardNames: Locator = this.page.locator('app-recently-viewed-products app-product-card .card-title a');
  private readonly productCardPrices: Locator = this.page.locator('app-recently-viewed-products app-product-card .fw-bold.text-primary');
  private readonly viewDetailsButtons: Locator = this.page.locator('app-recently-viewed-products app-product-card a.btn-outline-primary');

  // ─── Private Locators: PDP Elements ───────────────────────────────────────────

  private readonly pdpProductName: Locator = this.page.locator('app-product-detail h2.fw-bold');
  private readonly pdpProductPrice: Locator = this.page.locator('app-product-detail h3.text-primary');
  private readonly pdpProductImage: Locator = this.page.locator('app-product-detail img.img-fluid');
  private readonly pdpAddToCartButton: Locator = this.page.locator('app-product-detail button.btn-warning.btn-lg');

  // ─── Private Locators: Navigation / Header ────────────────────────────────────

  private readonly homeLink: Locator = this.page.locator('a.navbar-brand');
  private readonly cartLink: Locator = this.page.locator('a[routerlink="/cart"]');
  private readonly cartBadge: Locator = this.page.locator('a[routerlink="/cart"] .badge');
  private readonly userDropdownButton: Locator = this.page.getByRole('button', { name: /Demo/ });
  private readonly logoutButton: Locator = this.page.locator('button.dropdown-item.text-danger');

  constructor(page: Page) {
    super(page);
  }

  // ─── Reusable Interaction Methods ─────────────────────────────────────────────

  async navigateToHomepage(): Promise<void> {
    this.logAction();
    await this.page.goto(this.config.homepageURL);
    await this.waitForPageLoad();
  }

  async navigateToProduct(productId: number): Promise<void> {
    this.logAction(`Navigating to product ${productId}`);
    await this.page.goto(`${this.config.productsURL}/${productId}`);
    await this.waitForPageLoad();
  }

  async clickHomeLink(): Promise<void> {
    this.logAction();
    await this.click(this.homeLink);
    await this.waitForNavigation();
  }

  async clickViewDetailsOnCard(cardIndex: number = 0): Promise<void> {
    this.logAction(`Clicking View Details on card index: ${cardIndex}`);
    await this.click(this.viewDetailsButtons.nth(cardIndex));
    await this.waitForNavigation();
  }

  async clickAddToCartOnPDP(): Promise<void> {
    this.logAction();
    await this.click(this.pdpAddToCartButton);
  }

  async clickLogout(): Promise<void> {
    this.logAction();
    await this.click(this.userDropdownButton);
    await this.click(this.logoutButton);
    await this.waitForNavigation();
  }

  // ─── Business Workflow Methods ────────────────────────────────────────────────

  /** TC-01: Navigate to Homepage to view recently viewed section */
  async load(): Promise<void> {
    this.logAction();
    await this.navigateToHomepage();
  }

  /** TC-01: Browse multiple products sequentially to populate recently viewed */
  async browseProducts(productIds: number[]): Promise<void> {
    this.logAction(`Browsing ${productIds.length} products`);
    for (const productId of productIds) {
      await this.navigateToProduct(productId);
    }
  }

  /** TC-04: Browse more than max allowed products to test overflow */
  async browseProductsBeyondLimit(): Promise<void> {
    this.logAction();
    await this.browseProducts(this.config.productIds);
  }

  /** TC-02: Login via the login page */
  async loginAsUser(): Promise<void> {
    this.logAction();
    await this.page.goto(this.config.loginURL);
    await this.waitForPageLoad();
    await this.fill(this.page.getByPlaceholder('you@example.com'), this.config.username);
    await this.fill(this.page.getByPlaceholder('••••••••'), this.config.password);
    await Promise.all([
      this.page.waitForURL('**/'),
      this.click(this.page.getByRole('button', { name: 'Sign In' })),
    ]);
    await this.waitForNavigation();
  }

  // ─── Data Retrieval Methods ───────────────────────────────────────────────────

  /** TC-01, TC-04: Get count of products displayed in recently viewed section */
  async getRecentlyViewedProductCount(): Promise<number> {
    this.logAction();
    return await this.productCards.count();
  }

  /** TC-01, TC-03: Get all product names in recently viewed section */
  async getRecentlyViewedProductNames(): Promise<string[]> {
    this.logAction();
    const count = await this.productCardNames.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      names.push(await this.pwUtil.getText(this.productCardNames.nth(i)));
    }
    return names;
  }

  /** TC-03: Get all product prices in recently viewed section */
  async getRecentlyViewedProductPrices(): Promise<string[]> {
    this.logAction();
    const count = await this.productCardPrices.count();
    const prices: string[] = [];
    for (let i = 0; i < count; i++) {
      prices.push(await this.pwUtil.getText(this.productCardPrices.nth(i)));
    }
    return prices;
  }

  /** TC-03: Get product name from a specific card */
  async getProductCardName(cardIndex: number = 0): Promise<string> {
    this.logAction();
    return await this.pwUtil.getText(this.productCardNames.nth(cardIndex));
  }

  /** TC-03: Get product price from a specific card */
  async getProductCardPrice(cardIndex: number = 0): Promise<string> {
    this.logAction();
    return await this.pwUtil.getText(this.productCardPrices.nth(cardIndex));
  }

  /** TC-01: Get product name from the PDP */
  async getPDPProductName(): Promise<string> {
    this.logAction();
    return await this.pwUtil.getText(this.pdpProductName);
  }

  /** TC-01, TC-04: Get cart badge count */
  async getCartBadgeCount(): Promise<string> {
    this.logAction();
    return await this.pwUtil.getText(this.cartBadge);
  }

  /** TC-01, TC-04: Get localStorage recently viewed items */
  async getLocalStorageRecentlyViewed(): Promise<any[]> {
    this.logAction();
    const data = await this.page.evaluate((key) => {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    }, this.config.localStorageKey);
    return data;
  }

  /** TC-04: Get localStorage recently viewed item count */
  async getLocalStorageItemCount(): Promise<number> {
    this.logAction();
    const items = await this.getLocalStorageRecentlyViewed();
    return items.length;
  }

  /** TC-01: Clear localStorage before test */
  async clearLocalStorage(): Promise<void> {
    this.logAction();
    await this.page.evaluate(() => localStorage.clear());
  }

  // ─── Validation Methods ───────────────────────────────────────────────────────

  /** TC-01: Verify recently viewed section is visible */
  async isRecentlyViewedSectionVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.recentlyViewedHeading);
  }

  /** TC-01: Verify recently viewed carousel is displayed */
  async isRecentlyViewedCarouselVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.carouselSection);
  }

  /** TC-03: Verify product card image is visible */
  async isProductCardImageVisible(cardIndex: number = 0): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.productCardImages.nth(cardIndex));
  }

  /** TC-03: Verify product card name is visible */
  async isProductCardNameVisible(cardIndex: number = 0): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.productCardNames.nth(cardIndex));
  }

  /** TC-03: Verify product card price is visible */
  async isProductCardPriceVisible(cardIndex: number = 0): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.productCardPrices.nth(cardIndex));
  }

  /** TC-03: Verify View Details button is visible on card */
  async isViewDetailsButtonVisible(cardIndex: number = 0): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.viewDetailsButtons.nth(cardIndex));
  }

  /** TC-03: Verify Add to Cart button is visible on PDP */
  async isAddToCartButtonVisibleOnPDP(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.pdpAddToCartButton);
  }

  /** TC-01: Verify current page is Homepage */
  async isOnHomepage(): Promise<boolean> {
    this.logAction();
    const url = this.page.url();
    return url === this.config.homepageURL || url === `${this.config.homepageURL}#`;
  }

  /** TC-01: Verify current page is PDP */
  async isOnProductPage(): Promise<boolean> {
    this.logAction();
    return this.page.url().includes('/products/');
  }
}
