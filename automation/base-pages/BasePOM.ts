import { Page, Locator } from '@playwright/test';
import { createPlaywrightUtil } from '../utils/PlayWrightUtil';

/**
 * Base Page Object Parent class providing common functionality 
 * This class provides common functionality for all page claases & page compoments
 * Following Single Responsibility Principle (SRP) and DRY principle
 */
export class BasePOM {
  protected readonly page: Page;
  protected readonly pwUtil: ReturnType<typeof createPlaywrightUtil>;

  constructor(page: Page) {
    this.page = page;
    this.pwUtil = createPlaywrightUtil(page, {
      defaultTimeout: 30000,
      retryAttempts: 3,
      retryDelay: 500
    });
  }
  
  async click(locator: Locator): Promise<void> {
    // await locator.waitFor({ state: 'visible' });
    // await locator.click();

    await this.pwUtil.click(locator);
  }

  async fill(locator: Locator, value: string): Promise<void> {
    // await locator.waitFor({ state: 'visible' });
    // await locator.clear();
    // await locator.waitFor( {timeout:250} );
    // await locator.fill(value);
    await this.pwUtil.fill(locator, value);
  }

  /**
 * Gets the class name in human-readable format.
 * "QuoteDetailsPage" => "Quote Details Page"
 */
protected getClassName(): string {
  return this.constructor.name.replace(/([a-z])([A-Z])/g, '$1 $2');
}

/**
 * Gets the calling method name in human-readable format.
 * "isQuickEntryButtonDisplayed" => "is quick entry button displayed"
 */
protected getMethodName(): string {
  const stack = new Error().stack;
  const callerLine = stack?.split('\n')[3] || '';
  const methodMatch = callerLine.match(/at (?:\w+\.)?(\w+)/);
  return methodMatch
    ? methodMatch[1].replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
    : 'unknown method';
}

/**
 * Logs the current method action with class name and method name.
 * @param message - Optional additional context message
 * Usage: this.logAction(); or this.logAction('with product SKU 12345');
 * Output: "[ACTION] Quote Details Page => is quick entry button displayed"
 * Output: "[ACTION] Quote Details Page => add products to quote | with product SKU 12345"
 */
protected logAction(message?: string): void {
  const log = message
    ? `${this.getClassName()} => ${this.getMethodName()} | ${message}`
    : `${this.getClassName()} => ${this.getMethodName()}`;
  console.log(log);
}

}