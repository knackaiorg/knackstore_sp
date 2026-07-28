import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base-pages/BasePage';
import { TestConfig } from '../checkout-delivery-options.config';

export class DeliveryOptionsPage extends BasePage {

  private readonly config = new TestConfig();

  // ─── Private Locators ───────────────────────────────────────────────────────

  private readonly deliveryOptionsCard: Locator = this.page.locator('.card-header', { hasText: 'Delivery Options' });
  private readonly standardDeliveryRadio: Locator = this.page.getByRole('radio', { name: 'Standard Delivery' });
  private readonly twoDayDeliveryRadio: Locator = this.page.getByRole('radio', { name: '2-Day Delivery' });
  private readonly nextDayDeliveryRadio: Locator = this.page.getByRole('radio', { name: 'Next-Day Delivery' });
  private readonly standardDeliveryLabel: Locator = this.page.getByLabel('Standard Delivery');
  private readonly twoDayDeliveryLabel: Locator = this.page.getByLabel('2-Day Delivery');
  private readonly nextDayDeliveryLabel: Locator = this.page.getByLabel('Next-Day Delivery');
  private readonly continueToPaymentButton: Locator = this.page.getByRole('button', { name: 'Continue to Payment' });
  private readonly backButton: Locator = this.page.getByRole('button', { name: '← Back' });
  private readonly orderSummaryCard: Locator = this.page.locator('.card-header', { hasText: 'Order Summary' });
  private readonly subtotalRow: Locator = this.page.locator('.d-flex.justify-content-between', { hasText: 'Subtotal' });
  private readonly deliveryFeeRow: Locator = this.page.locator('.d-flex.justify-content-between', { hasText: 'Delivery' });
  private readonly totalRow: Locator = this.page.locator('.d-flex.justify-content-between.fw-bold.fs-5');
  private readonly freeDeliveryMessage: Locator = this.page.locator('.text-success.fw-bold');
  private readonly checkoutHeading: Locator = this.page.getByRole('heading', { name: 'Checkout' });
  private readonly deliveryStepBadge: Locator = this.page.locator('.step-badge', { hasText: '2. Delivery Options' });
  private readonly continueToDeliveryOptionsButton: Locator = this.page.getByRole('button', { name: 'Continue to Delivery Options' });

  constructor(page: Page) {
    super(page);
  }

  // ─── Reusable Interaction Methods ─────────────────────────────────────────────

  async load(): Promise<void> {
    this.logAction();
    await this.page.goto(this.config.checkoutURL);
    await this.page.waitForLoadState('networkidle');
    await this.clickContinueToDeliveryOptions();
  }

  async ensureLoaded(): Promise<void> {
    this.logAction();
    const heading = await this.isVisible(this.checkoutHeading);
    const card = await this.isVisible(this.deliveryOptionsCard);
    const summary = await this.isVisible(this.orderSummaryCard);
    if (!heading || !card || !summary) {
      throw new Error('Delivery Options page did not load correctly');
    }
  }

  async clickContinueToDeliveryOptions(): Promise<void> {
    this.logAction();
    await this.click(this.continueToDeliveryOptionsButton);
  }

  async selectStandardDelivery(): Promise<void> {
    this.logAction();
    await this.click(this.standardDeliveryRadio);
  }

  async selectTwoDayDelivery(): Promise<void> {
    this.logAction();
    await this.click(this.twoDayDeliveryRadio);
  }

  async selectNextDayDelivery(): Promise<void> {
    this.logAction();
    await this.click(this.nextDayDeliveryRadio);
  }

  async clickContinueToPayment(): Promise<void> {
    this.logAction();
    await this.click(this.continueToPaymentButton);
  }

  async clickBack(): Promise<void> {
    this.logAction();
    await this.click(this.backButton);
  }

  // ─── Data Retrieval Methods ────────────────────────────────────────────────────

  async getDeliveryFeeText(): Promise<string> {
    this.logAction();
    const feeSpan = this.deliveryFeeRow.locator('span').nth(1);
    return await this.pwUtil.getText(feeSpan);
  }

  async getOrderTotal(): Promise<string> {
    this.logAction();
    const totalSpan = this.totalRow.locator('span').nth(1);
    return await this.pwUtil.getText(totalSpan);
  }

  async getSubtotal(): Promise<string> {
    this.logAction();
    const subtotalSpan = this.subtotalRow.locator('span').nth(1);
    return await this.pwUtil.getText(subtotalSpan);
  }

  async getStandardDeliveryFee(): Promise<string> {
    this.logAction();
    const feeLabel = this.page.locator('label', { hasText: 'Standard Delivery' }).locator('.fw-bold').last();
    return await this.pwUtil.getText(feeLabel);
  }

  async getTwoDayDeliveryFee(): Promise<string> {
    this.logAction();
    const feeLabel = this.page.locator('label', { hasText: '2-Day Delivery' }).locator('p.fw-bold').first();
    return await this.pwUtil.getText(feeLabel);
  }

  async getNextDayDeliveryFee(): Promise<string> {
    this.logAction();
    const feeLabel = this.page.locator('label', { hasText: 'Next-Day Delivery' }).locator('.fw-bold').last();
    return await this.pwUtil.getText(feeLabel);
  }

  async getFreeDeliveryMessage(): Promise<string> {
    this.logAction();
    return await this.pwUtil.getText(this.freeDeliveryMessage);
  }

  // ─── Validation Methods ────────────────────────────────────────────────────────

  async isDeliveryOptionsCardVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.deliveryOptionsCard);
  }

  async isStandardDeliveryVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.standardDeliveryLabel);
  }

  async isTwoDayDeliveryVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.twoDayDeliveryLabel);
  }

  async isNextDayDeliveryVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.nextDayDeliveryLabel);
  }

  async isOrderSummaryVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.orderSummaryCard);
  }

  async isDeliveryFeeDisplayedSeparately(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.deliveryFeeRow);
  }

  async isContinueToPaymentEnabled(): Promise<boolean> {
    this.logAction();
    return await this.continueToPaymentButton.isEnabled();
  }

  async isStandardDeliverySelected(): Promise<boolean> {
    this.logAction();
    return await this.standardDeliveryRadio.isChecked();
  }

  async isTwoDayDeliverySelected(): Promise<boolean> {
    this.logAction();
    return await this.twoDayDeliveryRadio.isChecked();
  }

  async isNextDayDeliverySelected(): Promise<boolean> {
    this.logAction();
    return await this.nextDayDeliveryRadio.isChecked();
  }

  async isDeliveryStepActive(): Promise<boolean> {
    this.logAction();
    const classList = await this.deliveryStepBadge.getAttribute('class');
    return classList?.includes('active') ?? false;
  }

  // ─── Business Workflow Methods ─────────────────────────────────────────────────

  async verifyAllDeliveryOptionsDisplayed(): Promise<boolean> {
    this.logAction();
    const standard = await this.isStandardDeliveryVisible();
    const twoDay = await this.isTwoDayDeliveryVisible();
    const nextDay = await this.isNextDayDeliveryVisible();
    return standard && twoDay && nextDay;
  }

  async selectDeliveryOptionAndGetTotal(option: 'standard' | '2-day' | 'next-day'): Promise<{ fee: string; total: string }> {
    this.logAction(option);
    switch (option) {
      case 'standard':
        await this.selectStandardDelivery();
        break;
      case '2-day':
        await this.selectTwoDayDelivery();
        break;
      case 'next-day':
        await this.selectNextDayDelivery();
        break;
    }
    await this.page.waitForTimeout(500); // brief wait for UI update
    const fee = await this.getDeliveryFeeText();
    const total = await this.getOrderTotal();
    return { fee, total };
  }

  async attemptContinueWithoutSelection(): Promise<void> {
    this.logAction();
    await this.clickContinueToPayment();
  }

  async verifyPageLoaded(): Promise<boolean> {
    this.logAction();
    const heading = await this.isVisible(this.checkoutHeading);
    const card = await this.isDeliveryOptionsCardVisible();
    const summary = await this.isOrderSummaryVisible();
    return heading && card && summary;
  }

  // ─── Cart Setup Methods (for testing delivery fee thresholds) ──────────────

  /**
   * Adds items to cart via UI to reach a target total amount
   * Uses product navigation and add-to-cart interactions
   * Clears cart before adding to ensure clean state
   * @param targetTotal Approximate target cart total (may not be exact due to product pricing)
   */
  async addProductsToCartForTotal(targetTotal: number): Promise<void> {
    this.logAction(`Target total: ${targetTotal}`);
    
    // Clear cart first to ensure clean state
    await this.page.goto(`${this.config.appURL}cart`);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
    
    // Remove all existing items
    let removeButtons = this.page.locator('button:has-text("✕")');
    let count = await removeButtons.count();
    while (count > 0) {
      await removeButtons.first().click();
      await this.page.waitForTimeout(500); // Wait for item removal
      await this.page.waitForLoadState('networkidle');
      removeButtons = this.page.locator('button:has-text("✕")');
      count = await removeButtons.count();
    }
    
    // Wait to ensure cart is empty
    await this.page.waitForTimeout(1000);
    
    // Product catalog with known prices (from the KnackStore app)
    // Using in-stock products only (Product 1 is out of stock)
    const products = [
      { id: 2, name: 'GalaxyEdge S25', price: 899.99 },     // For high totals (>$200)
      { id: 10, name: 'HyperCharge 100W USB-C', price: 49.99 }, // For low totals (<$200)
      { id: 3, name: 'PurePhone 9', price: 699.99 },        // For mid-range totals
      { id: 7, name: 'SoundMax WH-1000XM6', price: 349.99 }, // Alternative mid-range
      { id: 8, name: 'AirBuds Pro 2', price: 249.99 }       // Alternative mid-range
    ];
    
    // Select product based on target total
    let selectedProduct;
    if (targetTotal >= 700) {
      selectedProduct = products[0]; // $899.99 (covers >$200 case)
    } else if (targetTotal >= 600) {
      selectedProduct = products[2]; // $699.99
    } else if (targetTotal >= 300) {
      selectedProduct = products[3]; // $349.99
    } else if (targetTotal >= 200) {
      selectedProduct = products[4]; // $249.99
    } else {
      selectedProduct = products[1]; // $49.99 (covers <$200 case)
    }
    
    // Navigate to product and add to cart
    await this.page.goto(`${this.config.appURL}products/${selectedProduct.id}`);
    await this.page.waitForLoadState('networkidle');
    
    // Wait for page to be fully loaded
    await this.page.waitForTimeout(1000);
    
    // Click add to cart button
    const addToCartBtn = this.page.getByRole('button', { name: /add to cart/i });
    await addToCartBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addToCartBtn.click();
    await this.page.waitForTimeout(1500);
  }

  /**
   * Clears all items from the cart via UI
   */
  async clearCartViaUI(): Promise<void> {
    this.logAction();
    await this.page.goto(`${this.config.appURL}cart`);
    await this.page.waitForLoadState('networkidle');
    
    // Click remove button for each item until cart is empty
    const removeButtons = this.page.locator('button:has-text(\"✕\")');
    const count = await removeButtons.count();
    for (let i = 0; i < count; i++) {
      await removeButtons.first().click();
      await this.page.waitForTimeout(300);
    }
  }
}
