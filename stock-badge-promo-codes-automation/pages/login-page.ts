import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base-pages/BasePage';

/**
 * Page Object for the Login Page.
 * Handles user authentication flow.
 */
export class LoginPage extends BasePage {

  // ─── Private Locators ───────────────────────────────────────────────────────

  private readonly emailField: Locator;
  private readonly passwordField: Locator;
  private readonly signInButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailField = this.page.getByPlaceholder('you@example.com');
    this.passwordField = this.page.getByPlaceholder('••••••••');
    this.signInButton = this.page.getByRole('button', { name: 'Sign In' });
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  async navigateTo(url: string): Promise<void> {
    this.logAction(`Navigating to ${url}`);
    await this.page.goto(url);
    await this.waitForPageLoad();
  }

  // ─── Interaction Methods ────────────────────────────────────────────────────

  async enterEmail(email: string): Promise<void> {
    this.logAction(`Entering email: ${email}`);
    await this.fill(this.emailField, email);
  }

  async enterPassword(password: string): Promise<void> {
    this.logAction('Entering password');
    await this.fill(this.passwordField, password);
  }

  async clickSignIn(): Promise<void> {
    this.logAction();
    await this.click(this.signInButton);
  }

  // ─── Business Workflow Methods ──────────────────────────────────────────────

  /**
   * Performs complete login with URL wait and navigation guard.
   */
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
}
