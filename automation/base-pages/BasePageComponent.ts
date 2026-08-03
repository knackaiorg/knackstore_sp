import { Page } from '@playwright/test';
import { BasePOM } from './BasePOM';

/**
 * Base Page Object class providing common functionality for all page objects
 * Following Single Responsibility Principle (SRP) and DRY principle
 */
export class BasePageComponent extends BasePOM {

  constructor(page: Page) {
    super(page);
  }
  
}