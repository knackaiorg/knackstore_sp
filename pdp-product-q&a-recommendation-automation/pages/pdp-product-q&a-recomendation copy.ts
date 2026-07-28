import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base-pages/BasePage';
import { TestConfig } from '../pdp-product-q&a-recommendation-data.config';

export class PDPPage extends BasePage {
  private readonly config = new TestConfig();

  private readonly reviewsSection: Locator;
  private readonly reviewsSectionHeading: Locator;
  private readonly questionsSection: Locator;
  private readonly questionsSectionHeading: Locator;
  private readonly askQuestionCard: Locator;
  private readonly askQuestionHeading: Locator;
  private readonly questionTextArea: Locator;
  private readonly submitQuestionButton: Locator;
  private readonly characterCounter: Locator;

  constructor(page: Page) {
    super(page);
    this.reviewsSection = this.page.locator('.reviews-section');
    this.reviewsSectionHeading = this.reviewsSection.getByRole('heading', { name: 'Customer Reviews' });
    this.questionsSection = this.page.locator('.questions-section');
    this.questionsSectionHeading = this.questionsSection.getByRole('heading', { name: 'Customer Questions & Answers' });
    this.askQuestionCard = this.questionsSection.locator('.card.border-0.shadow-sm');
    this.askQuestionHeading = this.askQuestionCard.getByRole('heading', { name: 'Ask a Question' });
    this.questionTextArea = this.page.locator('#new-question');
    this.submitQuestionButton = this.askQuestionCard.getByRole('button', { name: 'Submit Question' });
    this.characterCounter = this.askQuestionCard.locator('small.text-muted').first();
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
}
