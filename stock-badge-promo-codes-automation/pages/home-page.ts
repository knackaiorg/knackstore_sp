import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base-pages/BasePage';
import { PdpStockBadgePromoCodesPage } from './pdp-stock-badge-promo-codes-page';

/**
 * Page Object for the Home Page (Product Listing Page).
 * Handles navigation from homepage to PDP by clicking on a product.
 */
export class HomePage extends BasePage {

  // ─── Private Locators ───────────────────────────────────────────────────────

  private readonly productCards: Locator;
  private readonly firstProductViewDetails: Locator;
  private readonly featuredProductsHeading: Locator;
  private readonly heroSection: Locator;

  constructor(page: Page) {
    super(page);
    this.productCards = this.page.locator('app-product-card .card.product-card');
    this.firstProductViewDetails = this.page.getByRole('link', { name: 'View Details' }).first();
    this.featuredProductsHeading = this.page.getByRole('heading', { name: 'Featured Products' });
    this.heroSection = this.page.locator('section.hero-section');
  }

  // ─── Validation Methods ─────────────────────────────────────────────────────

  async isHomePageLoaded(): Promise<boolean> {
    this.logAction();
    return await this.pwUtil.isVisible(this.heroSection);
  }

  // ─── Interaction Methods ────────────────────────────────────────────────────

  async clickFirstProduct(): Promise<PdpStockBadgePromoCodesPage> {
    this.logAction();
    await this.pwUtil.waitForVisible(this.firstProductViewDetails);
    await this.click(this.firstProductViewDetails);
    await this.waitForPageLoad();
    return new PdpStockBadgePromoCodesPage(this.page);
  }

  async clickProductByIndex(index: number): Promise<PdpStockBadgePromoCodesPage> {
    this.logAction(`Clicking product at index: ${index}`);
    const viewDetailsLink = this.page.getByRole('link', { name: 'View Details' }).nth(index);
    await this.pwUtil.waitForVisible(viewDetailsLink);
    await this.click(viewDetailsLink);
    await this.waitForPageLoad();
    return new PdpStockBadgePromoCodesPage(this.page);
  }

  async getProductCount(): Promise<number> {
    this.logAction();
    return await this.pwUtil.count(this.productCards);
  }
}
