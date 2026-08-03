import { Locator, Page } from '@playwright/test';
import { BasePOM } from './BasePOM';

/**
 * Base Page Object class providing common functionality for all page objects
 * Following Single Responsibility Principle (SRP) and DRY principle
 */
export class BasePage extends BasePOM {

  constructor(page: Page) {
    super(page);
  }

  /**
   * THE COMMON METHOD: Instantiates any page AND automatically 
   * executes its specific loading rules before returning it.
   */
  static async create<T extends BasePage>(this: new (page: Page) => T, page: Page): Promise<T> {
    const instance = new this(page); // 1. Runs the normal constructor
    
    // 2. Automatically triggers the page's specific wait rules
    if (typeof (instance as any).ensureLoaded === 'function') {
      await (instance as any).ensureLoaded();
    }
    
    return instance; // 3. Returns the perfectly loaded page object
  }

  /**
   * Returns the SiteHeader component for all pages to use
   * Uses dynamic import to avoid circular dependency: BasePage → SiteHeader → SearchResultsPage → BasePage
   * @returns SiteHeader instance for header interactions
   */
  async getSiteHeader() {
    const { SiteHeader } = await import('../page-components/SiteHeader');
    return new SiteHeader(this.page);
  }
  
  /**
   * Wait for page to load with explicit wait
   * @returns this for fluent chaining
   */
  async waitForPageLoad(): Promise<this> {
    await this.page.waitForLoadState('networkidle');
    return this;
  }

  /**
   * Get the current URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Close the page
   */
  async close(): Promise<void> {
    await this.page.close();
  }

  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async isVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}