import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base-pages/BasePage';
import { TestConfig } from '../pdp-product-q&a-recommendation-data.config';
import { LoginPage } from './loginpage-product-q&a-recommendation-page';

export class HomePage extends BasePage {
  private readonly config = new TestConfig();

  private readonly navbar: Locator;
  private readonly loginButton: Locator;
  private readonly registerButton: Locator;
  private readonly heroSection: Locator;

  constructor(page: Page) {
    super(page);
    this.navbar = this.page.locator('nav.navbar');
    this.loginButton = this.navbar.getByRole('link', { name: 'Login' });
    this.registerButton = this.navbar.getByRole('link', { name: 'Register' });
    this.heroSection = this.page.locator('.hero-section');
  }

  async ensureLoaded(): Promise<void> {
    await this.heroSection.waitFor({ state: 'visible' });
  }

  static async load(page: Page): Promise<HomePage> {
    const instance = new HomePage(page);
    await page.goto(instance.config.appURL);
    await instance.ensureLoaded();
    return instance;
  }

  async clickLoginButton(): Promise<LoginPage> {
    this.logAction();
    await this.click(this.loginButton);
    return new LoginPage(this.page);
  }

  async isLoginButtonVisible(): Promise<boolean> {
    this.logAction();
    return this.isVisible(this.loginButton);
  }
}
