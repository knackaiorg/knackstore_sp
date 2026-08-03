import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base-pages/BasePage';
import { TestConfig } from '../pdp-product-q&a-recommendation-data.config';

export class LoginPage extends BasePage {
  private readonly config = new TestConfig();

  private readonly pageHeading: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly signInButton: Locator;
  private readonly registerLink: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading = this.page.getByRole('heading', { name: 'Welcome back' });
    this.emailInput = this.page.getByPlaceholder('you@example.com');
    this.passwordInput = this.page.getByPlaceholder('••••••••');
    this.signInButton = this.page.getByRole('button', { name: 'Sign In' });
    this.registerLink = this.page.getByRole('link', { name: 'Register here' });
  }

  async ensureLoaded(): Promise<void> {
    await this.pageHeading.waitFor({ state: 'visible' });
  }

  static async load(page: Page): Promise<LoginPage> {
    const instance = new LoginPage(page);
    await page.goto(`${instance.config.appURL}login`);
    await instance.ensureLoaded();
    return instance;
  }

  async enterEmail(email: string): Promise<void> {
    this.logAction(`with email: ${email}`);
    await this.fill(this.emailInput, email);
  }

  async enterPassword(password: string): Promise<void> {
    this.logAction();
    await this.fill(this.passwordInput, password);
  }

  async clickSignInButton(): Promise<void> {
    this.logAction();
    await this.click(this.signInButton);
  }

  async performLogin(email: string, password: string): Promise<void> {
    this.logAction(`with email: ${email}`);
    await this.waitForPageLoad();
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.isSignInButtonVisible();
    await Promise.all([
      this.page.waitForURL('**/'),
      this.clickSignInButton(),
    ]);
    await this.waitForNavigation();
  }

  async isSignInButtonVisible(): Promise<boolean> {
    this.logAction();
    return this.isVisible(this.signInButton);
  }

  async getPageHeadingText(): Promise<string | null> {
    this.logAction();
    return this.pageHeading.textContent();
  }
}
