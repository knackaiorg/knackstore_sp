import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base-pages/BasePage';

/**
 * Page Object for Product Detail Page — shared across Low Stock Badge & Promo Code features.
 * Covers badge visibility, text, colour, variant switching, and Add to Cart state.
 */
export class PdpStockBadgePromoCodesPage extends BasePage {

  // ─── Private Locators ───────────────────────────────────────────────────────

  private readonly stockBadge: Locator;
  private readonly addToCartButton: Locator;
  private readonly variantButtons: Locator;
  private readonly productTitle: Locator;

  constructor(page: Page) {
    super(page);
    this.stockBadge = this.page.locator('app-product-detail .badge');
    this.addToCartButton = this.page.getByRole('button', { name: 'Add to Cart' });
    this.variantButtons = this.page.locator('app-product-detail .d-flex.flex-wrap.gap-2 button');
    this.productTitle = this.page.getByRole('heading', { level: 2 });
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  async navigateTo(url: string): Promise<void> {
    this.logAction(`Navigating to ${url}`);
    await this.page.goto(url);
    await this.waitForPageLoad();
  }

  // ─── Badge Interaction Methods ──────────────────────────────────────────────

  async getStockBadgeText(): Promise<string> {
    this.logAction();
    return await this.pwUtil.getText(this.stockBadge);
  }

  async getStockBadgeColour(): Promise<string> {
    this.logAction();
    await this.pwUtil.waitForVisible(this.stockBadge);
    return await this.stockBadge.evaluate(el => getComputedStyle(el).color);
  }

  async getStockBadgeBackgroundColour(): Promise<string> {
    this.logAction();
    await this.pwUtil.waitForVisible(this.stockBadge);
    return await this.stockBadge.evaluate(el => getComputedStyle(el).backgroundColor);
  }

  async getStockBadgeClass(): Promise<string> {
    this.logAction();
    await this.pwUtil.waitForVisible(this.stockBadge);
    return await this.stockBadge.evaluate(el => el.className);
  }

  async isStockBadgeVisible(): Promise<boolean> {
    this.logAction();
    return await this.pwUtil.isVisible(this.stockBadge);
  }

  // ─── Out of Stock Methods ─────────────────────────────────────────────────

  async isOutOfStockLabelVisible(): Promise<boolean> {
    this.logAction();
    // Out of Stock uses a different badge class or text — check for text content
    const outOfStockLabel = this.page.locator('app-product-detail .badge', { hasText: 'Out of Stock' });
    return await this.pwUtil.isVisible(outOfStockLabel);
  }

  async getOutOfStockLabelText(): Promise<string> {
    this.logAction();
    const outOfStockLabel = this.page.locator('app-product-detail .badge', { hasText: 'Out of Stock' });
    return await this.pwUtil.getText(outOfStockLabel);
  }

  // ─── Add to Cart Methods ──────────────────────────────────────────────────

  async isAddToCartVisible(): Promise<boolean> {
    this.logAction();
    return await this.pwUtil.isVisible(this.addToCartButton);
  }

  async isAddToCartEnabled(): Promise<boolean> {
    this.logAction();
    return await this.pwUtil.isEnabled(this.addToCartButton);
  }

  async clickAddToCart(): Promise<void> {
    this.logAction();
    await this.click(this.addToCartButton);
  }

  // ─── Variant Methods ──────────────────────────────────────────────────────

  async selectVariant(variantText: string): Promise<void> {
    this.logAction(`Selecting variant: ${variantText}`);
    const variantButton = this.variantButtons.filter({ hasText: variantText });
    await this.click(variantButton);
  }

  async getVariantCount(): Promise<number> {
    this.logAction();
    return await this.variantButtons.count();
  }

  async selectVariantByIndex(index: number): Promise<void> {
    this.logAction(`Selecting variant at index: ${index}`);
    await this.variantButtons.nth(index).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Iterates through all variants and selects one whose badge text matches the given pattern.
   * Returns true if a matching variant was found and selected, false otherwise.
   */
  async selectVariantWithBadgeMatching(pattern: RegExp): Promise<boolean> {
    this.logAction(`Looking for variant with badge matching: ${pattern}`);
    const count = await this.getVariantCount();
    for (let i = 0; i < count; i++) {
      await this.selectVariantByIndex(i);
      const badgeText = await this.getStockBadgeText();
      if (pattern.test(badgeText)) {
        return true;
      }
    }
    return false;
  }

  async getSelectedVariantText(): Promise<string> {
    this.logAction();
    // Selected variant has class btn-primary (not btn-outline-secondary)
    const selectedVariant = this.page.locator('app-product-detail .d-flex.flex-wrap.gap-2 button.btn-primary');
    return await this.pwUtil.getText(selectedVariant);
  }

  // ─── Product Info Methods ─────────────────────────────────────────────────

  async getProductTitle(): Promise<string> {
    this.logAction();
    return await this.pwUtil.getText(this.productTitle);
  }
}
