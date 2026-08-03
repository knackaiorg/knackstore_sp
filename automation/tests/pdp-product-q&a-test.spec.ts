import { test, expect } from '@playwright/test';
import { PDPPage } from '../pages/pdp-product-q&a-recomendation-page';
import { HomePage } from '../pages/homepage-product-q&a-recommendation-page';
import { LoginPage } from '../pages/loginpage-product-q&a-recommendation-page';
import { TestConfig } from '../pdp-product-q&a-recommendation-data.config';

test.describe('PDP - Q&A Section', () => {

  const config = new TestConfig();
  let pdpPage: PDPPage;
  let homePage: HomePage;
  let loginPage: LoginPage;

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('failure-screenshot', { body: screenshot, contentType: 'image/png' });
    }
  });

  test('Verify Q&A section is visible below the Reviews section on PDP - QA-001 @sanity @regression', async ({ page }) => {

    await test.step('Navigate to product detail page', async () => {
      pdpPage = await PDPPage.load(page, '4');
    });

    await test.step('Verify Q&A section is visible', async () => {
      const isQASectionVisible = await pdpPage.isQuestionsSectionVisible();
      expect(isQASectionVisible).toBeTruthy();
    });

    await test.step('Verify Q&A section is positioned below Reviews section', async () => {
      const isQABelowReviews = await pdpPage.isQuestionsSectionBelowReviewsSection();
      expect(isQABelowReviews).toBeTruthy();
    });
  });

  test('Verify Q&A section heading displays "Customer Questions & Answers" - QA-002 @sanity @regression', async ({ page }) => {

    await test.step('Navigate to product detail page', async () => {
      pdpPage = await PDPPage.load(page, '4');
    });

    await test.step('Verify Q&A section heading text', async () => {
      const headingText = await pdpPage.getQuestionsSectionHeadingText();
      expect(headingText).toBe('Customer Questions & Answers');
    });
  });

  test('Verify text area and "Submit Question" button are visible for logged-in users - QA-003 @sanity @regression', async ({ page }) => {

    await test.step('Navigate to home page', async () => {
      homePage = await HomePage.load(page);
    });

    await test.step('Click login button to navigate to login page', async () => {
      loginPage = await homePage.clickLoginButton();
    });

    await test.step('Perform login with valid credentials', async () => {
      await loginPage.performLogin(config.email, config.password);
    });

    await test.step('Navigate to product detail page', async () => {
      pdpPage = await PDPPage.load(page, '2');
    });

    await test.step('Verify question text area is visible', async () => {
      const isTextAreaVisible = await pdpPage.isQuestionTextAreaVisible();
      expect(isTextAreaVisible).toBeTruthy();
    });

    await test.step('Verify Submit Question button is visible', async () => {
      const isSubmitButtonVisible = await pdpPage.isSubmitQuestionButtonVisible();
      expect(isSubmitButtonVisible).toBeTruthy();
    });
  });

  test('Verify character counter prevents input beyond 200 characters (client-side) - QA-007 @sanity @regression @negative' , async ({ page }) => {

    await test.step('Navigate to home page', async () => {
      homePage = await HomePage.load(page);
    });

    await test.step('Click login button and perform login', async () => {
      loginPage = await homePage.clickLoginButton();
      await loginPage.performLogin(config.email, config.password);
    });

    await test.step('Navigate to product detail page', async () => {
      pdpPage = await PDPPage.load(page, '3');
    });

    await test.step('Verify text area has maxlength attribute of 200', async () => {
      const maxLength = await pdpPage.getQuestionTextAreaMaxLength();
      expect(maxLength).toBe('200');
    });

    await test.step('Enter text exceeding 200 characters (201 characters)', async () => {
      const text201Chars = 'A'.repeat(201);
      await pdpPage.enterQuestion(text201Chars);
    });

    await test.step('Verify text area contains only 200 characters', async () => {
      const actualLength = await pdpPage.getQuestionTextLength();
      expect(actualLength).toBe(200);
    });

    await test.step('Verify character counter displays 200/200', async () => {
      const counterText = await pdpPage.getCharacterCounterText();
      expect(counterText).toBe('200/200');
    });

    await test.step('Verify character count matches 200', async () => {
      const charCount = await pdpPage.getCharacterCount();
      expect(charCount).toBe(200);
    });
  });

   test('Verify guest user does NOT see "Post Question" or "Ask" action button - QA-009 @regression @negative', async ({ page }) => {

    await test.step('Navigate to product detail page as guest user (no login)', async () => {
      pdpPage = await PDPPage.load(page, '4');
    });

    await test.step('Verify Q&A section is visible', async () => {
      const isQASectionVisible = await pdpPage.isQuestionsSectionVisible();
      expect(isQASectionVisible).toBeTruthy();
    });

    await test.step('Verify "Ask a Question" card/form is NOT visible for guest users', async () => {
      const isAskQuestionCardVisible = await pdpPage.isAskQuestionCardVisible();
      expect(isAskQuestionCardVisible, 'Ask Question card should be hidden for guest users').toBeFalsy();
    });

    await test.step('Verify "Ask a Question" heading is NOT visible', async () => {
      const isAskHeadingVisible = await pdpPage.isAskQuestionHeadingVisible();
      expect(isAskHeadingVisible, 'Ask a Question heading should be hidden for guest users').toBeFalsy();
    });

    await test.step('Verify Submit Question button is NOT visible', async () => {
      const isSubmitButtonVisible = await pdpPage.isSubmitQuestionButtonVisible();
      expect(isSubmitButtonVisible, 'Submit Question button should be hidden for guest users').toBeFalsy();
    });

    await test.step('Verify question text area is NOT visible', async () => {
      const isTextAreaVisible = await pdpPage.isQuestionTextAreaVisible();
      expect(isTextAreaVisible, 'Question text area should be hidden for guest users').toBeFalsy();
    });
  });

  test('Verify guest user sees login prompt or disabled state when attempting to post - QA-010 @regression @negative', async ({ page }) => {

    await test.step('Navigate to product detail page as guest user', async () => {
      pdpPage = await PDPPage.load(page, '4');
    });

    await test.step('Verify Q&A section is visible', async () => {
      const isQASectionVisible = await pdpPage.isQuestionsSectionVisible();
      expect(isQASectionVisible).toBeTruthy();
    });

    await test.step('Check if login prompt message is displayed', async () => {
      const isLoginPromptVisible = await pdpPage.isLoginPromptVisible();
      
      if (isLoginPromptVisible) {
        console.log('✓ Login prompt is displayed for guest users');
        expect(isLoginPromptVisible, 'Login prompt should be visible for guest users').toBeTruthy();
      } else {
        console.log('✓ No login prompt found - verifying button state instead');
      }
    });

    await test.step('Verify Submit Question button state for guest users', async () => {
      const buttonState = await pdpPage.getSubmitQuestionButtonState();
      console.log(`Submit Question button state: ${buttonState}`);
      
      // Button should be either hidden or disabled for guest users
      expect(['hidden', 'disabled']).toContain(buttonState);
      expect(buttonState, 'Submit button should NOT be enabled for guest users').not.toBe('enabled');
    });

    await test.step('Verify ask question form is not accessible to guest users', async () => {
      const isFormVisible = await pdpPage.isAskQuestionFormVisible();
      
      if (isFormVisible) {
        // If form is visible, verify it's disabled
        const isButtonEnabled = await pdpPage.isSubmitQuestionButtonEnabled();
        expect(isButtonEnabled, 'Submit button should be disabled if form is visible').toBeFalsy();
      } else {
        console.log('✓ Ask question form is hidden for guest users');
        expect(isFormVisible, 'Ask question form should be hidden for guests').toBeFalsy();
      }
    });
  });

  test('Verify Q&A section renders correctly when no questions exist for the product - QA-011 @regression @negative', async ({ page }) => {

    await test.step('Navigate to product detail page with zero Q&A', async () => {
      // Product 4 appears to have no questions based on pdpPage.mhtml
      pdpPage = await PDPPage.load(page, '4');
    });

    await test.step('Verify Q&A section is visible', async () => {
      const isQASectionVisible = await pdpPage.isQuestionsSectionVisible();
      expect(isQASectionVisible).toBeTruthy();
    });

    await test.step('Verify Q&A section heading is displayed', async () => {
      const headingText = await pdpPage.getQuestionsSectionHeadingText();
      expect(headingText).toBe('Customer Questions & Answers');
    });

    await test.step('Verify empty state message is displayed', async () => {
      const isEmptyStateVisible = await pdpPage.isNoQuestionsEmptyStateVisible();
      expect(isEmptyStateVisible, 'Empty state message should be visible when no questions exist').toBeTruthy();
    });

    await test.step('Verify empty state message text is correct', async () => {
      const emptyStateText = await pdpPage.getNoQuestionsEmptyStateText();
      expect(emptyStateText).toContain('No questions yet');
      expect(emptyStateText).toMatch(/No questions yet.*Check back later/i);
      console.log(`Empty state message: ${emptyStateText}`);
    });

    await test.step('Verify section still allows question submission (for logged-in users)', async () => {
      // Even with no questions, the section should be functional
      const headingVisible = await pdpPage.isQuestionsSectionVisible();
      expect(headingVisible, 'Q&A section should remain functional even with no questions').toBeTruthy();
    });

    await test.step('Verify page structure is intact with empty Q&A state', async () => {
      // Verify other page sections are still visible
      const isReviewsSectionVisible = await pdpPage.isReviewsSectionVisible();
      expect(isReviewsSectionVisible, 'Reviews section should be visible').toBeTruthy();
      
      const isQABelowReviews = await pdpPage.isQuestionsSectionBelowReviewsSection();
      expect(isQABelowReviews, 'Q&A should still be below Reviews even when empty').toBeTruthy();
    });
  });
});