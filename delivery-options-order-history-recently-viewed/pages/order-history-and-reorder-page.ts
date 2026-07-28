import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base-pages/BasePage';
import { TestConfig } from '../order-history-and-reorder.config';

/**
 * Page Object for Order History (My Orders list), Order Detail, and Reorder flows.
 * Covers: My Orders list page, Order Detail page, Cart page (post-reorder verification).
 * Mapped to test cases: TC-001 through TC-010.
 */
export class OrderHistoryAndReorderPage extends BasePage {

  private readonly config = new TestConfig();

  // ─── Private Locators: My Orders List Page ────────────────────────────────────
  // Source: My-Order-Page.mhtml

  private readonly myOrdersHeading: Locator = this.page.getByRole('heading', { name: 'My Orders' });
  private readonly statusFilterDropdown: Locator = this.page.getByRole('combobox', { name: 'Filter by status:' });
  private readonly orderCards: Locator = this.page.locator('.card.shadow-sm.mb-3');
  private readonly emptyStateMessage: Locator = this.page.getByText("You haven't placed any orders yet");
  private readonly noOrdersFoundMessage: Locator = this.page.getByText('No orders found');

  // ─── Private Locators: Order Detail Page ──────────────────────────────────────
  // Source: View-Order_page.mhtml

  private readonly backToOrdersButton: Locator = this.page.getByRole('link', { name: '← Back to Orders' });
  private readonly orderDetailHeading: Locator = this.page.locator('h2.fw-bold', { hasText: 'Order ' });
  private readonly deliveryAddressCard: Locator = this.page.locator('.card-header', { hasText: 'Delivery Address' });
  private readonly orderInfoCard: Locator = this.page.locator('.card-header', { hasText: 'Order Info' });
  private readonly itemsOrderedCard: Locator = this.page.locator('.card-header', { hasText: 'Items Ordered' });
  private readonly orderDetailStatusBadge: Locator = this.page.locator('.d-flex.justify-content-between .badge');
  private readonly reorderButton: Locator = this.page.getByRole('button', { name: 'ReOrder' });
  private readonly subtotalValue: Locator = this.page.locator('.d-flex.justify-content-between', { hasText: 'Subtotal' }).locator('span').nth(1);
  private readonly totalValue: Locator = this.page.locator('.d-flex.justify-content-between.fw-bold .text-primary');
  private readonly discountSection: Locator = this.page.locator('.d-flex.justify-content-between', { hasText: 'Discount' });
  private readonly noPromoCodeText: Locator = this.page.getByText('No promo code applied');

  // ─── Private Locators: Cart Page (Post-Reorder) ───────────────────────────────
  // Source: ReOrderPage.mhtml

  private readonly shoppingCartHeading: Locator = this.page.getByRole('heading', { name: 'Shopping Cart' });
  private readonly cartItemRows: Locator = this.page.locator('.card.shadow-sm .d-flex.align-items-center.p-3');

  // ─── Private Locators: Notifications ──────────────────────────────────────────

  private readonly unavailableItemsNotification: Locator = this.page.getByText('One or more items were not added because they are no longer available');
  private readonly noItemsAddedNotification: Locator = this.page.getByText('no items could be added', { exact: false });
  private readonly errorBanner: Locator = this.page.locator('.alert-danger');
  private readonly successBanner: Locator = this.page.locator('.alert-success');

  // ─── Private Locators: Navigation / Auth ──────────────────────────────────────

  private readonly userDropdownButton: Locator = this.page.getByRole('button', { name: /Demo/ });
  private readonly myOrdersDropdownLink: Locator = this.page.getByRole('link', { name: 'My Orders' });
  private readonly loginPageHeading: Locator = this.page.getByRole('heading', { name: 'Welcome back' });
  // ─── Private Locators: Order Placement Flow ───────────────────────────────

  private readonly proceedToCheckoutButton: Locator = this.page.getByRole('button', { name: 'Proceed to Checkout' });
  private readonly continueToPaymentButton: Locator = this.page.getByRole('button', { name: 'Continue to Payment' });
  private readonly confirmOrderButton: Locator = this.page.getByRole('button', { name: 'Confirm Order' });
  private readonly placeOrderButton: Locator = this.page.getByRole('button', { name: 'Place Order' });
  private readonly orderSuccessMessage: Locator = this.page.locator('.alert-success, .alert.alert-success');
  private readonly orderConfirmationHeading: Locator = this.page.getByRole('heading', { name: /Order.*Confirmed|Thank.*You|Success/i });
  private readonly orderReferenceOnConfirmation: Locator = this.page.locator('text=/ORD-[A-Z0-9]+/');
  private readonly creditCardRadio: Locator = this.page.getByRole('radio', { name: /credit.*card/i });
  private readonly paymentMethodSection: Locator = this.page.locator('.card-header', { hasText: /Payment/i });
  constructor(page: Page) {
    super(page);
  }

  // ─── Order Placement Flow Methods ─────────────────────────────────────────

  /** Navigate from cart to checkout */
  async proceedToCheckout(): Promise<void> {
    this.logAction();
    await this.click(this.proceedToCheckoutButton);
    await this.page.waitForLoadState('networkidle');
  }

  /** Continue from delivery options to payment */
  async continueToPayment(): Promise<void> {
    this.logAction();
    await this.click(this.continueToPaymentButton);
    await this.page.waitForLoadState('networkidle');
  }

  /** Select credit card payment method */
  async selectCreditCardPayment(): Promise<void> {
    this.logAction();
    const isVisible = await this.isVisible(this.creditCardRadio);
    if (isVisible) {
      await this.click(this.creditCardRadio);
    }
  }

  /** Click confirm/place order button */
  async confirmOrder(): Promise<void> {
    this.logAction();
    // Try both button names
    const confirmBtn = await this.isVisible(this.confirmOrderButton);
    const placeBtn = await this.isVisible(this.placeOrderButton);
    
    if (confirmBtn) {
      await this.click(this.confirmOrderButton);
    } else if (placeBtn) {
      await this.click(this.placeOrderButton);
    } else {
      // Try generic continue button
      await this.page.getByRole('button', { name: /continue|confirm|place/i }).first().click();
    }
    await this.page.waitForLoadState('networkidle');
  }

  /** Check if order success message is displayed */
  async isOrderSuccessVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.orderSuccessMessage) || await this.isVisible(this.orderConfirmationHeading);
  }

  /** Get order reference number from confirmation page */
  async getOrderReferenceFromConfirmation(): Promise<string> {
    this.logAction();
    try {
      return await this.pwUtil.getText(this.orderReferenceOnConfirmation);
    } catch {
      // Extract from URL or page content
      const url = await this.page.url();
      const match = url.match(/ORD-[A-Z0-9]+/);
      return match ? match[0] : '';
    }
  }

  /** Check if on payment page */
  async isOnPaymentPage(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.paymentMethodSection);
  }

  // ─── Reusable Interaction Methods ─────────────────────────────────────────────

  async selectStatusFilter(status: 'All' | 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED'): Promise<void> {
    this.logAction(`Selecting filter: ${status}`);
    await this.statusFilterDropdown.selectOption(status);
  }

  async clickViewButtonOnOrder(orderIndex: number = 0): Promise<void> {
    this.logAction(`Clicking View on order index: ${orderIndex}`);
    const viewLink = this.orderCards.nth(orderIndex).getByRole('link', { name: 'View' });
    await this.click(viewLink);
    await this.waitForNavigation();
  }

  async clickReorderOnOrderList(orderIndex: number = 0): Promise<void> {
    this.logAction(`Clicking ReOrder on order index: ${orderIndex}`);
    const reorderBtn = this.orderCards.nth(orderIndex).getByRole('button', { name: 'ReOrder' });
    await this.click(reorderBtn);
    await this.page.waitForURL('**/cart', { timeout: 10000 });
    await this.waitForNavigation();
  }

  async clickReorderOnOrderDetail(): Promise<void> {
    this.logAction();
    await this.click(this.reorderButton);
    await this.page.waitForURL('**/cart', { timeout: 10000 });
    await this.waitForNavigation();
  }

  async clickBackToOrders(): Promise<void> {
    this.logAction();
    await this.click(this.backToOrdersButton);
    await this.waitForNavigation();
  }

  // ─── Business Workflow Methods ────────────────────────────────────────────────

  /** TC-001, TC-002, TC-005, TC-010: Navigate to My Orders page directly */
  async load(): Promise<void> {
    this.logAction();
    await this.page.goto(`${this.config.appURL}account/orders`);
    await this.waitForNavigation();
  }

  /** TC-001: Navigate to My Orders via Account dropdown menu */
  async navigateToMyOrdersViaMenu(): Promise<void> {
    this.logAction();
    await this.click(this.userDropdownButton);
    await this.click(this.myOrdersDropdownLink);
    await this.waitForNavigation();
  }

  /** TC-004: Attempt to access My Orders page directly without auth */
  async navigateToMyOrdersDirectly(): Promise<void> {
    this.logAction();
    await this.page.goto(`${this.config.appURL}account/orders`);
    await this.waitForNavigation();
  }

  /** TC-002: Navigate to Order Detail page by clicking View on order list */
  async viewOrderDetail(orderIndex: number = 0): Promise<void> {
    this.logAction();
    await this.clickViewButtonOnOrder(orderIndex);
  }

  /** TC-003, TC-008, TC-009: Perform Reorder from Order Detail page */
  async reorderFromDetailPage(): Promise<void> {
    this.logAction();
    await this.clickReorderOnOrderDetail();
  }

  /** TC-006: Perform Reorder from Order List page */
  async reorderFromListPage(orderIndex: number = 0): Promise<void> {
    this.logAction();
    await this.clickReorderOnOrderList(orderIndex);
  }

  // ─── Data Retrieval Methods ───────────────────────────────────────────────────

  /** TC-001: Get count of orders displayed on list page */
  async getOrderCount(): Promise<number> {
    this.logAction();
    return await this.orderCards.count();
  }

  /** TC-001: Get order reference number from list row */
  async getOrderReferenceNumber(orderIndex: number = 0): Promise<string> {
    this.logAction();
    const refElement = this.orderCards.nth(orderIndex).locator('.col-md-3 .fw-bold');
    return await this.pwUtil.getText(refElement);
  }

  /** TC-001: Get order date from list row */
  async getOrderDate(orderIndex: number = 0): Promise<string> {
    this.logAction();
    const dateElement = this.orderCards.nth(orderIndex).locator('.col-md-2', { hasText: 'Date' }).locator('div:not(.text-muted)');
    return await this.pwUtil.getText(dateElement);
  }

  /** TC-001: Get order total from list row */
  async getOrderTotal(orderIndex: number = 0): Promise<string> {
    this.logAction();
    const totalElement = this.orderCards.nth(orderIndex).locator('.fw-bold.text-primary');
    return await this.pwUtil.getText(totalElement);
  }

  /** TC-001: Get order status badge text from list row */
  async getOrderStatus(orderIndex: number = 0): Promise<string> {
    this.logAction();
    const statusBadge = this.orderCards.nth(orderIndex).locator('.badge');
    return await this.pwUtil.getText(statusBadge);
  }

  /** TC-001: Get item summary text from list row */
  async getItemSummary(orderIndex: number = 0): Promise<string> {
    this.logAction();
    const summaryCol = this.orderCards.nth(orderIndex).locator('.col-md-2').last();
    return await this.pwUtil.getText(summaryCol);
  }

  /** TC-005: Get currently selected filter value */
  async getSelectedFilterValue(): Promise<string> {
    this.logAction();
    return await this.statusFilterDropdown.inputValue();
  }

  /** TC-002: Get delivery address text from Order Detail page */
  async getDeliveryAddress(): Promise<string> {
    this.logAction();
    const addressBody = this.deliveryAddressCard.locator('..').locator('.card-body');
    return await this.pwUtil.getText(addressBody);
  }

  /** TC-002: Get order detail heading text (e.g. "Order ORD-5E0DA727") */
  async getOrderDetailHeading(): Promise<string> {
    this.logAction();
    return await this.pwUtil.getText(this.orderDetailHeading);
  }

  /** TC-002: Get order status from Order Detail page */
  async getOrderDetailStatus(): Promise<string> {
    this.logAction();
    return await this.pwUtil.getText(this.orderDetailStatusBadge);
  }

  /** TC-002: Get subtotal from Order Detail page */
  async getOrderSubtotal(): Promise<string> {
    this.logAction();
    return await this.pwUtil.getText(this.subtotalValue);
  }

  /** TC-002: Get total from Order Detail page */
  async getOrderDetailTotal(): Promise<string> {
    this.logAction();
    return await this.pwUtil.getText(this.totalValue);
  }

  /** TC-002: Get all line items from Order Detail page */
  async getOrderedItems(): Promise<{ name: string; quantity: string; price: string }[]> {
    this.logAction();
    const itemRows = this.itemsOrderedCard.locator('..').locator('.card-body .p-3');
    const count = await itemRows.count();
    const items: { name: string; quantity: string; price: string }[] = [];

    for (let i = 0; i < count; i++) {
      const row = itemRows.nth(i);
      const name = await this.pwUtil.getText(row.locator('.fw-semibold'));
      const quantityPrice = await this.pwUtil.getText(row.locator('.text-muted.small'));
      const totalPrice = await this.pwUtil.getText(row.locator('.fw-bold'));
      items.push({ name, quantity: quantityPrice, price: totalPrice });
    }

    return items;
  }

  /** TC-003, TC-007: Get cart item names after reorder */
  async getCartItemNames(): Promise<string[]> {
    this.logAction();
    const nameElements = this.cartItemRows.locator('.fw-semibold');
    const count = await nameElements.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      names.push(await this.pwUtil.getText(nameElements.nth(i)));
    }
    return names;
  }

  /** TC-003, TC-007: Get cart item count after reorder */
  async getCartItemCount(): Promise<number> {
    this.logAction();
    return await this.cartItemRows.count();
  }

  /** TC-005: Get all order statuses currently displayed in the list */
  async getAllOrderStatuses(): Promise<string[]> {
    this.logAction();
    const count = await this.orderCards.count();
    const statuses: string[] = [];
    for (let i = 0; i < count; i++) {
      statuses.push(await this.getOrderStatus(i));
    }
    return statuses;
  }

  // ─── Validation Methods ───────────────────────────────────────────────────────

  /** TC-001: Verify My Orders page loaded */
  async isMyOrdersPageVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.myOrdersHeading);
  }

  /** TC-002: Verify Order Detail page loaded */
  async isOrderDetailPageVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.orderDetailHeading);
  }

  /** TC-010: Verify empty state message is shown */
  async isEmptyStateVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.emptyStateMessage);
  }

  /** TC-005: Verify "No orders found" message for filtered status */
  async isNoOrdersFoundVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.noOrdersFoundMessage);
  }

  /** TC-002: Verify delivery address card is displayed */
  async isDeliveryAddressCardVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.deliveryAddressCard);
  }

  /** TC-002: Verify items ordered card is displayed */
  async isItemsOrderedCardVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.itemsOrderedCard);
  }

  /** TC-002: Verify Back to Orders button is displayed */
  async isBackToOrdersButtonVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.backToOrdersButton);
  }

  /** TC-002: Verify discount/promo code section */
  async isDiscountSectionVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.discountSection);
  }

  /** TC-002: Verify "No promo code applied" text */
  async isNoPromoCodeTextVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.noPromoCodeText);
  }

  /** TC-003, TC-006: Verify user is on Cart page after reorder */
  async isShoppingCartPageVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.shoppingCartHeading);
  }

  /** TC-003, TC-006: Verify current URL is Cart page */
  async isOnCartPage(): Promise<boolean> {
    this.logAction();
    return this.page.url().includes('/cart');
  }

  /** TC-002: Verify current URL is My Orders page */
  async isOnMyOrdersPage(): Promise<boolean> {
    this.logAction();
    return this.page.url().includes('/account/orders');
  }

  /** TC-008: Verify unavailable items notification */
  async isUnavailableItemsNotificationVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.unavailableItemsNotification);
  }

  /** TC-009: Verify no items could be added notification */
  async isNoItemsAddedNotificationVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.noItemsAddedNotification);
  }

  /** TC-004: Verify user was redirected to login page */
  async isRedirectedToLogin(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.loginPageHeading);
  }

  /** Error handling: Verify error banner displayed (red banner per user stories) */
  async isErrorBannerVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.errorBanner);
  }

  /** Success handling: Verify success banner displayed (green banner per user stories) */
  async isSuccessBannerVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.successBanner);
  }
}
