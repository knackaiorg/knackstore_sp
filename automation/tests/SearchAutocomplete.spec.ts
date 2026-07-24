import { test, expect } from '@playwright/test';
import { TestConfig } from '../SearchAutocompleteData.config';
import { SearchAutocompletePage } from '../pages/SearchAutocompletePage';

/**
 * Search Autocomplete — functional automation for the KnackStore global search
 * suggestion dropdown (see testcases/Search_Autocomplete_Automation_Test_Cases.md).
 *
 * Covered: TC-01 (US-01), TC-05 (US-03), TC-06 (US-04), TC-12 (US-09).
 *
 * NOTE: The only Page Object available today is SearchAutocompletePage. TC-05/TC-06/TC-12
 * reference a few additional POM methods and TestConfig values that do not exist yet.
 */
test.describe('Search Autocomplete - Suggestion Dropdown & Navigation', { tag: '@sanity' }, () => {

  const config = new TestConfig();
  let searchPage: SearchAutocompletePage;

  test.beforeEach(async ({ page }) => { 
    await test.step('Launch the store and wait for the search box', async () => {
      searchPage = new SearchAutocompletePage(page);
      await searchPage.load();
    });

  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('failure-screenshot', { body: screenshot, contentType: 'image/png' });
    }
  });

  test('TC-01 (US-01) Typing exactly 2 characters with matching data displays the suggestion dropdown', 
    { tag: '@sanity' }, async ({ page }) => {

    await test.step('Type exactly 2 characters that match seeded catalog data', async () => {
      await searchPage.searchAndAwaitSuggestions(config.matchingTwoCharQuery);
    });

    await test.step('Verify the suggestion dropdown is displayed', async () => {
      expect(await searchPage.isSuggestionDropdownVisible()).toBe(true);
    });
    
    await test.step('Verify the suggestion count > 0 is displayed', async () => {
      expect(await searchPage.getSuggestionCount()).toBeGreaterThan(0);
    });
  });

  test('TC-05 (US-03) Clicking a product suggestion navigates directly to the PDP, bypassing the search results page',
    { tag: '@sanity' }, async ({ page }) => {

    const initialUrl = await searchPage.getCurrentUrl();
    await test.step('Search for a product term and await suggestions', async () => {
      await searchPage.searchAndAwaitSuggestions(config.productQuery);
    });

    await test.step('Click the matching product suggestion', async () => {
      await searchPage.clickSuggestion(config.productSuggestionName);
      await searchPage.waitForNavigation();
    });

    await test.step('Verify navigation landed on the PDP and bypassed the search results page', async () => {
      const currentUrl = await searchPage.getCurrentUrl();
      expect(currentUrl).toContain(config.pdpUrlPattern);
      expect(currentUrl).not.toEqual(initialUrl);
    });
  });

  test('TC-06 (US-04) Clicking a category suggestion navigates to the PLP filtered to that category', 
    { tag: '@sanity' }, async ({ page }) => {

    const initialUrl = await searchPage.getCurrentUrl();
    await test.step('Search for a category term and await suggestions', async () => {
      await searchPage.searchAndAwaitSuggestions(config.categoryQuery);
    });

    await test.step('Click the matching category suggestion', async () => {
      await searchPage.clickSuggestion(config.categorySuggestionName);
      await searchPage.waitForNavigation();
    });

    await test.step('Verify navigation landed on the PLP filtered to that category', async () => {
      const currentUrl = await searchPage.getCurrentUrl();
      expect(currentUrl).toContain(config.plpUrlPattern);
      expect(currentUrl).not.toEqual(initialUrl);
    });
  });

  test('TC-12 (US-09) A zero-match query renders the dropdown with no products and a "no results found" message', 
    { tag: '@sanity' }, async ({ page }) => {

     await test.step('Type a term that matches no products, categories, or brands', async () => {
      await searchPage.enterSearchQuery(config.noMatchQuery);
    });

    await test.step('Verify the dropdown shows the "no results found" message and no product suggestions', async () => {
      expect(await searchPage.isNoResultsMessageVisible()).toBe(true);
      expect(await searchPage.getSuggestionCount()).toBe(0);
    });
  });
});
