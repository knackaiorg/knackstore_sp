import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base-pages/BasePage';
import { TestConfig } from '../SearchAutocompleteData.config';

/**
 * SearchAutocompletePage — Page Object for the KnackStore global search autocomplete
 * that lives in the site header (app-header > nav).
 *
 * Scope: strictly client-side Web UI interactions and DOM state verification.
 * Covers the elements required by the supplied manual test case:
 *   TC-01 (US-01) — Typing exactly 2 characters with matching data displays the
 *                   suggestion dropdown.
 *
 * Follows SOLID/DRY: reuses inherited BasePage / PlayWrightUtil behaviour instead of
 * invoking Playwright Locator APIs directly.
 */
export class SearchAutocompletePage extends BasePage {

  // ─── Private Locators ────────────────────────────────────────────────────────
  // No data-testid/role/aria-label on the input, so getByPlaceholder is the highest
  // priority stable, accessibility-oriented locator available for it.
  private readonly searchInput: Locator;
  private readonly suggestionDropdown: Locator;
  private readonly suggestionItems: Locator;
  private readonly noResultsMessage: Locator;

  private readonly config = new TestConfig();

  constructor(page: Page) {
    super(page);
    this.searchInput = this.page.getByPlaceholder('Search products...');
    this.suggestionDropdown = this.page.locator('.suggestion-dropdown');
    this.suggestionItems = this.suggestionDropdown.locator('.suggestion-item');
    this.noResultsMessage = this.page.locator('.list-group-item.text-muted', {
      hasText: 'No results found',
    });
  }

  // ─── Load / Readiness Rules ──────────────────────────────────────────────────

  /**
   * Specific loading rule invoked automatically by BasePage.create().
   * The search box is header-level, so its visibility confirms the shell is ready.
   */
  async ensureLoaded(): Promise<void> {
    this.logAction();
    await this.pwUtil.waitForVisible(this.searchInput);
  }

  /**
   * Business workflow: open the application and wait until the search box is ready.
   * @returns this for fluent chaining
   */
  async load(): Promise<this> {
    this.logAction(this.config.appURL);
    await this.page.goto(this.config.appURL);
    await this.waitForPageLoad();
    await this.ensureLoaded();
    return this;
  }

  // ─── Reusable Interaction Methods ────────────────────────────────────────────

  /**
   * Builds a locator for the suggestion row whose name (rendered in the
   * `.fw-semibold` element) matches the given text.
   * @param suggestion - Visible name of the suggestion
   */
  private suggestionByName(suggestion: string): Locator {
    return this.suggestionItems.filter({
      has: this.page.locator('.fw-semibold', { hasText: suggestion }),
    });
  }

  /**
   * Types a query into the search box character-by-character so per-keystroke
   * input events fire (the autocomplete listens to these). Clears any prior value first.
   * @param query - Text to type into the search field
   */
  async enterSearchQuery(query: string): Promise<void> {
    this.logAction(`query="${query}"`);
    await this.pwUtil.type(this.searchInput, query, { clearFirst: true });
  }

  // ─── Business Workflow Methods ───────────────────────────────────────────────

  /**
   * TC-01 workflow: type the given query and wait for the suggestion dropdown to render.
   * Use for the positive case where matching data is expected to produce suggestions.
   * @param query - Search text expected to yield matches
   * @returns this for fluent chaining
   */
  async searchAndAwaitSuggestions(query: string): Promise<this> {
    this.logAction(`query="${query}"`);
    await this.enterSearchQuery(query);
    await this.pwUtil.waitForVisible(this.suggestionDropdown);
    return this;
  }

  /**
   * Clicks the suggestion row whose product/category/brand name matches the given text.
   * @param suggestion - Visible name of the suggestion to select
   */
  async clickSuggestion(suggestion: string): Promise<void> {
    this.logAction(`suggestion="${suggestion}"`);
    await this.click(this.suggestionByName(suggestion));
  }

  // ─── Validation Methods ──────────────────────────────────────────────────────

  /**
   * @returns true when the suggestion dropdown container is displayed.
   */
  async isSuggestionDropdownVisible(): Promise<boolean> {
    this.logAction();
    return this.pwUtil.isVisible(this.suggestionDropdown);
  }

  /**
   * @returns true when the "No results found" message is displayed.
   *          Supports the negative case where the query yields no matching data.
   */
  async isNoResultsMessageVisible(): Promise<boolean> {
    this.logAction();
    return this.pwUtil.isVisible(this.noResultsMessage);
  }

  /**
   * @param suggestion - Visible name of the suggestion to look for
   * @returns true when a suggestion row with the given name is displayed in the dropdown.
   */
  async isSuggestionAvailable(suggestion: string): Promise<boolean> {
    this.logAction(`suggestion="${suggestion}"`);
    return this.pwUtil.isVisible(this.suggestionByName(suggestion));
  }

  /**
   * @returns the number of suggestion rows currently rendered in the dropdown.
   *          Supports the "with matching data" assertion of TC-01 (count > 0).
   */
  async getSuggestionCount(): Promise<number> {
    this.logAction();
    return this.pwUtil.count(this.suggestionItems);
  }
}
