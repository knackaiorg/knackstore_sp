import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

       // launch options for the browser
    launchOptions: {
      slowMo: 1000, // Slow down actions by 1.5 seconds to observe test execution
    },

        /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on first retry */
    video: 'retain-on-failure',
    
    /* Collect trace when retrying the failed test */
    trace: 'retain-on-failure',
    
    /* Timeouts from TestConfig */
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

    /* Global timeout for each test */
  timeout: 300000, // 5 minutes per test
  
  /* Expect timeout */
  expect: {
    timeout: 30000
  },

  projects: [
    {
      name: 'chromium',
      use: {
        channel: 'chrome',
        headless: false, // Run tests in headless mode
        
        /* Chrome options matching Java ChromeOptions */
        launchOptions: {
          args: [
            '--start-maximized',
            '--disable-popup-blocking',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled'
          ]
        },
        
        /* Viewport set to maximize */
        viewport: null, // Use full browser window
        
        /* Accept insecure certificates (matching Java setAcceptInsecureCerts) */
        ignoreHTTPSErrors: true
      }
    }
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
