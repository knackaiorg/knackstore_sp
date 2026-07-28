import { Page, Locator } from '@playwright/test';
import { createPlaywrightUtil } from '../utils/PlayWrightUtil';


export class BasePOM {
  protected readonly page: Page;
  protected readonly pwUtil: ReturnType<typeof createPlaywrightUtil>;

  constructor(page: Page) {
    this.page = page;
    this.pwUtil = createPlaywrightUtil(page, {
      defaultTimeout: 30000,
      retryAttempts: 3,
      retryDelay: 500
    });
  }
  
  async click(locator: Locator): Promise<void> {
    await this.pwUtil.click(locator);
  }

  async fill(locator: Locator, value: string): Promise<void> {
  
    await this.pwUtil.fill(locator, value);
  }


protected getClassName(): string {
  return this.constructor.name.replace(/([a-z])([A-Z])/g, '$1 $2');
}


protected getMethodName(): string {
  const stack = new Error().stack;
  const callerLine = stack?.split('\n')[3] || '';
  const methodMatch = callerLine.match(/at (?:\w+\.)?(\w+)/);
  return methodMatch
    ? methodMatch[1].replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
    : 'unknown method';
}


protected logAction(message?: string): void {
  const log = message
    ? `${this.getClassName()} => ${this.getMethodName()} | ${message}`
    : `${this.getClassName()} => ${this.getMethodName()}`;
  console.log(log);
}

}