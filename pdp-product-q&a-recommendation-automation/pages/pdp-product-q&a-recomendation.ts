import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base-pages/BasePage';
import { TestConfig } from '../pdp-product-q&a-recommendation-data.config';

export class PDPPage extends BasePage {
  private readonly config = new TestConfig();

  // Existing Q&A section locators
  private readonly reviewsSection: Locator;
  private readonly reviewsSectionHeading: Locator;
  private readonly questionsSection: Locator;
  private readonly questionsSectionHeading: Locator;
  private readonly askQuestionCard: Locator;
  private readonly askQuestionHeading: Locator;
  private readonly questionTextArea: Locator;
  private readonly submitQuestionButton: Locator;
  private readonly characterCounter: Locator;
  private readonly noQuestionsEmptyState: Locator;
  private readonly loginPromptMessage: Locator;
  
  // Product Recommendations ("Frequently Bought Together") section locators
  private readonly productDescription: Locator;
  private readonly frequentlyBoughtTogetherSection: Locator;  // app-product-carousel component
  private readonly frequentlyBoughtTogetherHeading: Locator;
  private readonly carouselWrapper: Locator;
  private readonly carouselTrack: Locator;
  private readonly recommendedProductCards: Locator;  // All product cards in carousel
  private readonly currentProductTitle: Locator;
  
  // Recently Viewed Products section locators
  private readonly recentlyViewedSection: Locator;
  private readonly recentlyViewedHeading: Locator;
  private readonly recentlyViewedCarouselWrapper: Locator;
  private readonly recentlyViewedProductCards: Locator;

  constructor(page: Page) {
    super(page);
    
    // Existing Q&A locators initialization
    this.reviewsSection = this.page.locator('.reviews-section');
    this.reviewsSectionHeading = this.reviewsSection.getByRole('heading', { name: 'Customer Reviews' });
    this.questionsSection = this.page.locator('.questions-section');
    this.questionsSectionHeading = this.questionsSection.getByRole('heading', { name: 'Customer Questions & Answers' });
    this.askQuestionCard = this.questionsSection.locator('.card.border-0.shadow-sm');
    this.askQuestionHeading = this.askQuestionCard.getByRole('heading', { name: 'Ask a Question' });
    this.questionTextArea = this.page.locator('#new-question');
    this.submitQuestionButton = this.askQuestionCard.getByRole('button', { name: 'Submit Question' });
    this.characterCounter = this.askQuestionCard.locator('small.text-muted').first();
    this.noQuestionsEmptyState = this.questionsSection.locator('.text-muted', { hasText: 'No questions yet' });
    this.loginPromptMessage = this.questionsSection.locator('.alert, .login-prompt, [class*="login"]');
    
    // Product Recommendations / Frequently Bought Together locators
    this.productDescription = this.page.locator('.mt-4 h5:has-text("Description")').locator('..').first();
    this.frequentlyBoughtTogetherSection = this.page.locator('app-product-carousel[title="Frequently Bought Together"]');
    this.frequentlyBoughtTogetherHeading = this.frequentlyBoughtTogetherSection.locator('h2.fw-bold.mb-0');
    this.carouselWrapper = this.frequentlyBoughtTogetherSection.locator('.carousel-wrapper');
    this.carouselTrack = this.frequentlyBoughtTogetherSection.locator('.carousel-track');
    this.recommendedProductCards = this.frequentlyBoughtTogetherSection.locator('app-product-card .card.product-card');
    this.currentProductTitle = this.page.locator('h2.fw-bold.mt-1').first();
    
    // Recently Viewed Products locators
    this.recentlyViewedSection = this.page.locator('app-recently-viewed-products app-product-carousel');
    this.recentlyViewedHeading = this.recentlyViewedSection.locator('h2.fw-bold.mb-0');
    this.recentlyViewedCarouselWrapper = this.recentlyViewedSection.locator('.carousel-wrapper');
    this.recentlyViewedProductCards = this.recentlyViewedSection.locator('app-product-card .card.product-card');
  }

  async ensureLoaded(): Promise<void> {
    await this.reviewsSection.waitFor({ state: 'visible' });
  }

  static async load(page: Page, productId: string): Promise<PDPPage> {
    const instance = new PDPPage(page);
    await page.goto(`${instance.config.appURL}products/${productId}`);
    await instance.ensureLoaded();
    return instance;
  }

  // ========== EXISTING Q&A METHODS ==========
  
  async isReviewsSectionVisible(): Promise<boolean> {
    this.logAction();
    return this.isVisible(this.reviewsSectionHeading);
  }

  async isQuestionsSectionVisible(): Promise<boolean> {
    this.logAction();
    return this.isVisible(this.questionsSectionHeading);
  }

  async isQuestionsSectionBelowReviewsSection(): Promise<boolean> {
    this.logAction();
    const reviewsBox = await this.reviewsSection.boundingBox();
    const questionsBox = await this.questionsSection.boundingBox();
    if (!reviewsBox || !questionsBox) return false;
    return questionsBox.y > reviewsBox.y;
  }

  async getQuestionsSectionHeadingText(): Promise<string | null> {
    this.logAction();
    return this.questionsSectionHeading.textContent();
  }

  async isQuestionTextAreaVisible(): Promise<boolean> {
    this.logAction();
    return this.isVisible(this.questionTextArea);
  }

  async isSubmitQuestionButtonVisible(): Promise<boolean> {
    this.logAction();
    return this.isVisible(this.submitQuestionButton);
  }

  async isAskQuestionFormVisible(): Promise<boolean> {
    this.logAction();
    const isTextAreaVisible = await this.isVisible(this.questionTextArea);
    const isButtonVisible = await this.isVisible(this.submitQuestionButton);
    return isTextAreaVisible && isButtonVisible;
  }

  async getCharacterCounterText(): Promise<string | null> {
    this.logAction();
    return this.characterCounter.textContent();
  }

  async enterQuestion(questionText: string): Promise<void> {
    this.logAction(`with question: ${questionText.substring(0, 50)}...`);
    await this.questionTextArea.fill(questionText);
  }

  async clickSubmitQuestionButton(): Promise<void> {
    this.logAction();
    await this.click(this.submitQuestionButton);
  }

  async getQuestionTextAreaValue(): Promise<string> {
    this.logAction();
    return this.questionTextArea.inputValue();
  }

  async getQuestionTextAreaMaxLength(): Promise<string | null> {
    this.logAction();
    return this.questionTextArea.getAttribute('maxlength');
  }

  async getCharacterCount(): Promise<number> {
    this.logAction();
    const counterText = await this.characterCounter.textContent();
    if (!counterText) return 0;
    const match = counterText.match(/^(\d+)\/\d+$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async getCharacterLimit(): Promise<number> {
    this.logAction();
    const counterText = await this.characterCounter.textContent();
    if (!counterText) return 0;
    const match = counterText.match(/^\d+\/(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async clearQuestionTextArea(): Promise<void> {
    this.logAction();
    await this.questionTextArea.clear();
  }

  async getQuestionTextLength(): Promise<number> {
    this.logAction();
    const text = await this.questionTextArea.inputValue();
    return text.length;
  }

  // New methods for guest user scenarios
  async isAskQuestionCardVisible(): Promise<boolean> {
    this.logAction();
    return this.isVisible(this.askQuestionCard);
  }

  async isAskQuestionHeadingVisible(): Promise<boolean> {
    this.logAction();
    return this.isVisible(this.askQuestionHeading);
  }

  async isNoQuestionsEmptyStateVisible(): Promise<boolean> {
    this.logAction();
    return this.isVisible(this.noQuestionsEmptyState);
  }

  async getNoQuestionsEmptyStateText(): Promise<string | null> {
    this.logAction();
    return this.noQuestionsEmptyState.textContent();
  }

  async isLoginPromptVisible(): Promise<boolean> {
    this.logAction();
    return this.isVisible(this.loginPromptMessage);
  }

  async isSubmitQuestionButtonEnabled(): Promise<boolean> {
    this.logAction();
    const isDisabled = await this.submitQuestionButton.isDisabled();
    return !isDisabled;
  }

  async getSubmitQuestionButtonState(): Promise<'enabled' | 'disabled' | 'hidden'> {
    this.logAction();
    const isVisible = await this.isVisible(this.submitQuestionButton);
    if (!isVisible) return 'hidden';
    const isDisabled = await this.submitQuestionButton.isDisabled();
    return isDisabled ? 'disabled' : 'enabled';
  }

  // ========== PRODUCT RECOMMENDATIONS / FREQUENTLY BOUGHT TOGETHER METHODS ==========

  // REC-001: Verify "Frequently Bought Together" section is visible
  async isFrequentlyBoughtTogetherSectionVisible(): Promise<boolean> {
    this.logAction();
    return this.isVisible(this.frequentlyBoughtTogetherSection);
  }

  async getFrequentlyBoughtTogetherHeadingText(): Promise<string | null> {
    this.logAction();
    return this.frequentlyBoughtTogetherHeading.textContent();
  }

  // REC-002: Verify section is positioned below product description and near reviews
  async isFrequentlyBoughtTogetherBelowProductDescription(): Promise<boolean> {
    this.logAction();
    const descBox = await this.productDescription.boundingBox();
    const fbtBox = await this.frequentlyBoughtTogetherSection.boundingBox();
    if (!descBox || !fbtBox) return false;
    return fbtBox.y > descBox.y;
  }

  async isFrequentlyBoughtTogetherNearReviews(): Promise<boolean> {
    this.logAction();
    const reviewsBox = await this.reviewsSection.boundingBox();
    const fbtBox = await this.frequentlyBoughtTogetherSection.boundingBox();
    if (!reviewsBox || !fbtBox) return false;
    // Check if section is within 500px of reviews section
    const distance = Math.abs(fbtBox.y - (reviewsBox.y + reviewsBox.height));
    return distance < 500;
  }

  // REC-003: Count recommended products
  async getRecommendedProductsCount(): Promise<number> {
    this.logAction();
    return this.recommendedProductCards.count();
  }

  // REC-004: Get recommended product details (for ordering/priority validation)
  async getRecommendedProductNames(): Promise<string[]> {
    this.logAction();
    const names: string[] = [];
    const count = await this.recommendedProductCards.count();
    for (let i = 0; i < count; i++) {
      const card = this.recommendedProductCards.nth(i);
      const nameElement = card.locator('.card-body h6.card-title a');
      const name = await nameElement.textContent();
      if (name) names.push(name.trim());
    }
    return names;
  }

  async getRecommendedProductIds(): Promise<string[]> {
    this.logAction();
    const ids: string[] = [];
    const count = await this.recommendedProductCards.count();
    for (let i = 0; i < count; i++) {
      const card = this.recommendedProductCards.nth(i);
      const id = await card.getAttribute('data-product-id');
      if (id) ids.push(id);
    }
    return ids;
  }

  // REC-007: Verify viewed product does NOT appear in recommendations
  async getCurrentProductName(): Promise<string | null> {
    this.logAction();
    return this.currentProductTitle.textContent();
  }

  async doesCurrentProductAppearInRecommendations(): Promise<boolean> {
    this.logAction();
    const currentName = await this.getCurrentProductName();
    if (!currentName) return false;
    const recommendedNames = await this.getRecommendedProductNames();
    return recommendedNames.some(name => name.trim() === currentName.trim());
  }

  // REC-008: Verify no duplicate products in recommendations
  async hasDuplicateRecommendedProducts(): Promise<boolean> {
    this.logAction();
    const names = await this.getRecommendedProductNames();
    const uniqueNames = new Set(names);
    return names.length !== uniqueNames.size;
  }

  // REC-010: Verify each recommended product card displays required elements
  async isRecommendedProductImageVisible(cardIndex: number): Promise<boolean> {
    this.logAction(`for card index: ${cardIndex}`);
    const card = this.recommendedProductCards.nth(cardIndex);
    const image = card.locator('img.card-img-top.product-image');
    return this.isVisible(image);
  }

  async getRecommendedProductImageSrc(cardIndex: number): Promise<string | null> {
    this.logAction(`for card index: ${cardIndex}`);
    const card = this.recommendedProductCards.nth(cardIndex);
    const image = card.locator('img.card-img-top.product-image');
    return image.getAttribute('src');
  }

  async isRecommendedProductImageLoaded(cardIndex: number): Promise<boolean> {
    this.logAction(`checking image load for card: ${cardIndex}`);
    const card = this.recommendedProductCards.nth(cardIndex);
    const image = card.locator('img').first();
    const naturalWidth = await image.evaluate((img: HTMLImageElement) => img.naturalWidth);
    return naturalWidth > 0;
  }

  async isRecommendedProductNameVisible(cardIndex: number): Promise<boolean> {
    this.logAction(`for card index: ${cardIndex}`);
    const card = this.recommendedProductCards.nth(cardIndex);
    const name = card.locator('.card-body h6.card-title a');
    return this.isVisible(name);
  }

  async getRecommendedProductName(cardIndex: number): Promise<string | null> {
    this.logAction(`for card index: ${cardIndex}`);
    const card = this.recommendedProductCards.nth(cardIndex);
    const name = card.locator('.card-body h6.card-title a');
    return name.textContent();
  }

  async isRecommendedProductPriceVisible(cardIndex: number): Promise<boolean> {
    this.logAction(`for card index: ${cardIndex}`);
    const card = this.recommendedProductCards.nth(cardIndex);
    const price = card.locator('.card-body span.fw-bold.text-primary.fs-5');
    return this.isVisible(price);
  }

  async getRecommendedProductPrice(cardIndex: number): Promise<string | null> {
    this.logAction(`for card index: ${cardIndex}`);
    const card = this.recommendedProductCards.nth(cardIndex);
    const price = card.locator('.card-body span.fw-bold.text-primary.fs-5');
    return price.textContent();
  }

  async isRecommendedProductRatingVisible(cardIndex: number): Promise<boolean> {
    this.logAction(`for card index: ${cardIndex}`);
    const card = this.recommendedProductCards.nth(cardIndex);
    const rating = card.locator('app-star-rating');
    return this.isVisible(rating);
  }

  async getRecommendedProductRating(cardIndex: number): Promise<string | null> {
    this.logAction(`for card index: ${cardIndex}`);
    const card = this.recommendedProductCards.nth(cardIndex);
    const rating = card.locator('app-star-rating');
    return rating.textContent();
  }

  async clickRecommendedProduct(cardIndex: number): Promise<void> {
    this.logAction(`clicking recommended product at index: ${cardIndex}`);
    const card = this.recommendedProductCards.nth(cardIndex);
    await this.click(card);
  }

  async getAllRecommendedProductDetails(): Promise<Array<{
    name: string | null;
    price: string | null;
    hasImage: boolean;
    hasRating: boolean;
  }>> {
    this.logAction();
    const details = [];
    const count = await this.getRecommendedProductsCount();
    for (let i = 0; i < count; i++) {
      details.push({
        name: await this.getRecommendedProductName(i),
        price: await this.getRecommendedProductPrice(i),
        hasImage: await this.isRecommendedProductImageVisible(i),
        hasRating: await this.isRecommendedProductRatingVisible(i)
      });
    }
    return details;
  }

  // Additional methods for product card details
  async getRecommendedProductVendor(cardIndex: number): Promise<string | null> {
    this.logAction(`for card index: ${cardIndex}`);
    const card = this.recommendedProductCards.nth(cardIndex);
    const vendor = card.locator('.card-body small.text-muted').first();
    return vendor.textContent();
  }

  async isRecommendedProductViewDetailsButtonVisible(cardIndex: number): Promise<boolean> {
    this.logAction(`for card index: ${cardIndex}`);
    const card = this.recommendedProductCards.nth(cardIndex);
    const button = card.locator('a.btn.btn-sm.btn-outline-primary');
    return this.isVisible(button);
  }

  async clickRecommendedProductViewDetailsButton(cardIndex: number): Promise<void> {
    this.logAction(`clicking View Details for product at index: ${cardIndex}`);
    const card = this.recommendedProductCards.nth(cardIndex);
    const button = card.locator('a.btn.btn-sm.btn-outline-primary');
    await this.click(button);
  }

  // Method to verify carousel navigation controls
  async isCarouselNavigationVisible(): Promise<boolean> {
    this.logAction();
    const prevButton = this.carouselWrapper.locator('.carousel-arrow-prev');
    const nextButton = this.carouselWrapper.locator('.carousel-arrow-next');
    const isPrevVisible = await this.isVisible(prevButton);
    const isNextVisible = await this.isVisible(nextButton);
    return isPrevVisible || isNextVisible;
  }

  async clickCarouselNextButton(): Promise<void> {
    this.logAction();
    const nextButton = this.carouselWrapper.locator('.carousel-arrow-next');
    await this.click(nextButton);
  }

  async clickCarouselPrevButton(): Promise<void> {
    this.logAction();
    const prevButton = this.carouselWrapper.locator('.carousel-arrow-prev');
    await this.click(prevButton);
  }

  // ========== RECENTLY VIEWED PRODUCTS METHODS ==========

  async isRecentlyViewedSectionVisible(): Promise<boolean> {
    this.logAction();
    return this.isVisible(this.recentlyViewedSection);
  }

  async getRecentlyViewedHeadingText(): Promise<string | null> {
    this.logAction();
    return this.recentlyViewedHeading.textContent();
  }

  async getRecentlyViewedProductsCount(): Promise<number> {
    this.logAction();
    return this.recentlyViewedProductCards.count();
  }

  async getRecentlyViewedProductName(cardIndex: number): Promise<string | null> {
    this.logAction(`for card index: ${cardIndex}`);
    const card = this.recentlyViewedProductCards.nth(cardIndex);
    const name = card.locator('.card-body h6.card-title a');
    return name.textContent();
  }

  async clickRecentlyViewedProduct(cardIndex: number): Promise<void> {
    this.logAction(`clicking recently viewed product at index: ${cardIndex}`);
    const card = this.recentlyViewedProductCards.nth(cardIndex);
    const link = card.locator('.card-body h6.card-title a');
    await this.click(link);
  }
}