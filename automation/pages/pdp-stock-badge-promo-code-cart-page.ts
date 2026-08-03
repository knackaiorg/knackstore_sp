import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base-pages/BasePage';

/**
 * Page Object for the Cart Page — Promo Code feature.
 * Covers promo code apply/remove, order summary, discount line, and validation messages.
 */
export class CartPage extends BasePage {

  // ─── Private Locators ───────────────────────────────────────────────────────

  // Cart page
  private readonly shoppingCartHeading: Locator;
  private readonly proceedToCheckoutButton: Locator;
  private readonly continueShoppingLink: Locator;

  // Order Summary
  private readonly orderSummaryHeading: Locator;
  private readonly subtotalRow: Locator;
  private readonly totalRow: Locator;
  private readonly discountRow: Locator;

  // Promo Code section (inside app-promo-code component)
  private readonly promoCodeInput: Locator;
  private readonly applyButton: Locator;
  private readonly removeButton: Locator;
  private readonly promoCodeSection: Locator;

  // Success state — "Promo Code Applied:" text + savings message (no .alert-success in DOM)
  private readonly promoAppliedText: Locator;
  private readonly promoSavingsText: Locator;

  // Error state — error text within the promo section (no .alert-danger in DOM)
  private readonly errorText: Locator;

  constructor(page: Page) {
    super(page);

    // Cart page
    this.shoppingCartHeading = this.page.getByRole('heading', { name: /Shopping Cart/ });
    this.proceedToCheckoutButton = this.page.getByRole('button', { name: /Proceed to Checkout/ });
    this.continueShoppingLink = this.page.getByRole('link', { name: 'Continue Shopping' });

    // Order Summary
    this.orderSummaryHeading = this.page.getByText('Order Summary');
    this.subtotalRow = this.page.locator('.d-flex.justify-content-between.mb-2').first();
    this.totalRow = this.page.locator('.d-flex.justify-content-between.fw-bold.fs-5');
    this.discountRow = this.page.getByText(/Discount \(/);

    // Promo Code section
    this.promoCodeSection = this.page.locator('app-promo-code');
    this.promoCodeInput = this.page.getByPlaceholder('Enter promo code (e.g., SAVE10)');
    this.applyButton = this.promoCodeSection.getByRole('button', { name: 'Apply' });
    this.removeButton = this.promoCodeSection.getByRole('button', { name: 'Remove' });

    // Success state (actual DOM: "Promo Code Applied:" + code name + "You saved $ X")
    this.promoAppliedText = this.promoCodeSection.getByText('Promo Code Applied:');
    this.promoSavingsText = this.promoCodeSection.getByText(/You saved/);

    // Error state (error messages rendered as text within the section)
    this.errorText = this.promoCodeSection.getByText(
      /not valid|already applied|minimum cart value|enter a promo code|only letters and numbers/i
    );
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  async navigateTo(url: string): Promise<void> {
    this.logAction(`Navigating to ${url}`);
    await this.page.goto(url);
    await this.waitForPageLoad();
  }

  // ─── Cart Page Validation ───────────────────────────────────────────────────

  async isCartPageLoaded(): Promise<boolean> {
    this.logAction();
    return await this.pwUtil.isVisible(this.shoppingCartHeading);
  }

  /**
   * Removes all items from the cart by clicking each ✕ button until none remain.
   */
  async emptyCart(): Promise<void> {
    this.logAction('Clearing all items from cart');
    const removeItemButtons = this.page.locator('app-cart .btn-outline-danger');
    let count = await removeItemButtons.count();
    while (count > 0) {
      await removeItemButtons.first().click();
      await this.page.waitForTimeout(500);
      count = await removeItemButtons.count();
    }
  }

  async isOrderSummaryVisible(): Promise<boolean> {
    this.logAction();
    return await this.pwUtil.isVisible(this.orderSummaryHeading);
  }

  // ─── Promo Code Input Methods ───────────────────────────────────────────────

  async enterPromoCode(code: string): Promise<void> {
    this.logAction(`Entering promo code: ${code}`);
    await this.fill(this.promoCodeInput, code);
  }

  async clickApply(): Promise<void> {
    this.logAction();
    await this.click(this.applyButton);
    // Wait for Angular to process API response — either applied card or error text appears
    // Use first() to avoid strict mode violation when both elements exist
    await this.promoAppliedText.or(this.errorText).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async clickRemove(): Promise<void> {
    this.logAction();
    await this.click(this.removeButton);
    // Wait for applied card to disappear confirming removal
    await this.promoAppliedText.waitFor({ state: 'hidden', timeout: 15000 });
  }

  async isPromoCodeInputVisible(): Promise<boolean> {
    this.logAction();
    return await this.pwUtil.isVisible(this.promoCodeInput);
  }

  async isApplyButtonVisible(): Promise<boolean> {
    this.logAction();
    return await this.pwUtil.isVisible(this.applyButton);
  }

  async isRemoveButtonVisible(): Promise<boolean> {
    this.logAction();
    return await this.pwUtil.isVisible(this.removeButton);
  }

  // ─── Business Workflow Methods ──────────────────────────────────────────────

  async applyPromoCode(code: string): Promise<void> {
    this.logAction(`Applying promo code: ${code}`);
    await this.enterPromoCode(code);
    await this.clickApply();
  }

  async removePromoCode(): Promise<void> {
    this.logAction();
    await this.clickRemove();
  }

  // ─── Alert / Message Methods ────────────────────────────────────────────────

  async isPromoAppliedSuccessfully(): Promise<boolean> {
    this.logAction();
    return await this.pwUtil.isVisible(this.promoAppliedText);
  }

  async getPromoSavingsText(): Promise<string> {
    this.logAction();
    await this.pwUtil.waitForVisible(this.promoSavingsText);
    return await this.pwUtil.getText(this.promoSavingsText);
  }

  async isPromoSavingsVisible(): Promise<boolean> {
    this.logAction();
    return await this.pwUtil.isVisible(this.promoSavingsText);
  }

  async getErrorMessageText(): Promise<string> {
    this.logAction();
    await this.pwUtil.waitForVisible(this.errorText);
    return await this.pwUtil.getText(this.errorText);
  }

  async isErrorMessageVisible(): Promise<boolean> {
    this.logAction();
    return await this.pwUtil.isVisible(this.errorText);
  }

  // ─── Applied Promo Code Methods ────────────────────────────────────────────

  async getAppliedPromoCodeText(): Promise<string> {
    this.logAction();
    // Use .applied-promo-card class (observed in actual DOM) — avoids :has-text ancestor ambiguity
    const appliedCard = this.promoCodeSection.locator('.applied-promo-card');
    await this.pwUtil.waitForVisible(appliedCard);
    return await this.pwUtil.getText(appliedCard);
  }

  async isPromoCodeApplied(): Promise<boolean> {
    this.logAction();
    return await this.pwUtil.isVisible(this.promoAppliedText);
  }

  // ─── Order Summary Methods ─────────────────────────────────────────────────

  async getSubtotalText(): Promise<string> {
    this.logAction();
    return await this.pwUtil.getText(this.subtotalRow);
  }

  async getTotalText(): Promise<string> {
    this.logAction();
    return await this.pwUtil.getText(this.totalRow);
  }

  async isDiscountLineVisible(): Promise<boolean> {
    this.logAction();
    return await this.pwUtil.isVisible(this.discountRow);
  }

  async getDiscountText(): Promise<string> {
    this.logAction();
    await this.pwUtil.waitForVisible(this.discountRow);
    return await this.pwUtil.getText(this.discountRow);
  }

  // ─── Checkout Methods ──────────────────────────────────────────────────────

  async clickProceedToCheckout(): Promise<void> {
    this.logAction();
    await this.click(this.proceedToCheckoutButton);
  }

  async isProceedToCheckoutVisible(): Promise<boolean> {
    this.logAction();
    return await this.pwUtil.isVisible(this.proceedToCheckoutButton);
  }
}
