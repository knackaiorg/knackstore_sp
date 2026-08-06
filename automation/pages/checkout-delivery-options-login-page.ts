import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base-pages/BasePage';
import { TestConfig } from '../checkout-delivery-options-data.config';

export class LoginPage extends BasePage {

  private readonly config = new TestConfig();

  // ─── Private Locators ───────────────────────────────────────────────────────

  private readonly emailField: Locator = this.page.getByPlaceholder('you@example.com');
  private readonly passwordField: Locator = this.page.getByPlaceholder('••••••••');
  private readonly signInButton: Locator = this.page.getByRole('button', { name: 'Sign In' });
  private readonly welcomeHeading: Locator = this.page.getByRole('heading', { name: 'Welcome back' });
  private readonly registerLink: Locator = this.page.getByRole('link', { name: 'Register here' });

  constructor(page: Page) {
    super(page);
  }

  // ─── Reusable Interaction Methods ─────────────────────────────────────────────

  async enterEmail(email: string): Promise<void> {
    this.logAction();
    await this.fill(this.emailField, email);
  }

  async enterPassword(password: string): Promise<void> {
    this.logAction();
    await this.fill(this.passwordField, password);
  }

  async clickSignIn(): Promise<void> {
    this.logAction();
    await this.click(this.signInButton);
  }

  // ─── Business Workflow Methods ─────────────────────────────────────────────────

  async load(): Promise<void> {
    this.logAction();
    await this.page.goto(this.config.loginURL);
    await this.page.waitForLoadState('networkidle');
  }

  async loginAndNavigate(): Promise<void> {
    this.logAction();
    await this.load();
    await this.performLogin(this.config.username, this.config.password);
  }

  async performLogin(email: string, password: string): Promise<void> {
    this.logAction();
    await this.enterEmail(email);
    await this.enterPassword(password);
    await Promise.all([
      this.page.waitForURL('**/'),
      this.clickSignIn(),
    ]);
    await this.waitForNavigation();
  }

  // ─── Validation Methods ────────────────────────────────────────────────────────

  async isLoginPageVisible(): Promise<boolean> {
    this.logAction();
    return await this.isVisible(this.welcomeHeading);
  }
}
