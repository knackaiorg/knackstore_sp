import { Locator, Page } from '@playwright/test';

/**
 * PlayWrightUtil - Production-grade Playwright wrapper with auto-wait, retry, and resilience.
 *
 * Design Principles:
 * - Every action method waits for the correct actionability state BEFORE acting
 * - Retry with exponential backoff (capped) for transient failures
 * - Non-blocking delay (avoids page.waitForTimeout anti-pattern)
 * - Boolean state checks use short timeouts to stay fast
 * - Action methods use full timeouts to be resilient
 * - Playwright's built-in auto-wait is leveraged, not fought
 */
export class PlayWrightUtil {
    private page: Page;
    private defaultTimeout: number;
    private retryAttempts: number;
    private retryDelay: number;
    private stateCheckTimeout: number;

    constructor(page: Page, options?: {
        defaultTimeout?: number;
        retryAttempts?: number;
        retryDelay?: number;
        stateCheckTimeout?: number;
    }) {
        this.page = page;
        this.defaultTimeout = options?.defaultTimeout ?? 30_000;
        this.retryAttempts = options?.retryAttempts ?? 3;
        this.retryDelay = options?.retryDelay ?? 500;
        this.stateCheckTimeout = options?.stateCheckTimeout ?? 5_000;
    }

    // ─── Private Helpers ────────────────────────────────────────────────────────

    /**
     * Non-blocking delay that doesn't rely on page.waitForTimeout (avoids ESLint anti-pattern)
     * @param ms - Milliseconds to wait
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Waits for a locator to reach a desired DOM/visibility state.
     * @param locator - Playwright locator to wait on
     * @param state - Target state: 'attached' | 'detached' | 'visible' | 'hidden'
     * @param timeout - Custom timeout in milliseconds (optional)
     */
    private async waitForState(
        locator: Locator,
        state: 'attached' | 'detached' | 'visible' | 'hidden' = 'visible',
        timeout?: number
    ): Promise<void> {
        await locator.waitFor({ state, timeout: timeout ?? this.defaultTimeout });
    }

    /**
     * Ensures the element is actionable: visible, stable, enabled, and not obscured.
     * Playwright's click/fill already do this internally, but calling it explicitly
     * before our pre-checks avoids race conditions in multi-step validation.
     * @param locator - Element locator to validate
     * @param timeout - Custom timeout in milliseconds (optional)
     */
    private async ensureActionable(locator: Locator, timeout?: number): Promise<void> {
        const t = timeout ?? this.defaultTimeout;
        await locator.waitFor({ state: 'visible', timeout: t });
        await locator.scrollIntoViewIfNeeded({ timeout: t });
    }

    /**
     * Executes an action with capped exponential backoff retry.
     * Delay: retryDelay * attempt (capped at 3s).
     * @param action - Async function to execute
     * @param actionName - Name of the action for error reporting
     * @param retries - Number of retry attempts (optional, defaults to configured retryAttempts)
     */
    private async executeWithRetry<T>(
        action: () => Promise<T>,
        actionName: string,
        retries: number = this.retryAttempts
    ): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await action();
            } catch (error) {
                lastError = error as Error;

                if (attempt < retries) {
                    const backoff = Math.min(this.retryDelay * attempt, 3000);
                    console.warn(
                        `[PlayWrightUtil] ${actionName} – attempt ${attempt}/${retries} failed: ${lastError.message}. Retrying in ${backoff}ms…`
                    );
                    await this.delay(backoff);
                }
            }
        }

        throw new Error(
            `[PlayWrightUtil] ${actionName} failed after ${retries} attempts.\nLast error: ${lastError?.message}`
        );
    }

    // ─── Action Methods ─────────────────────────────────────────────────────────

    /**
     * Click an element after ensuring it is visible, stable, enabled, and scrolled into view.
     * @param locator - Element locator
     * @param options - Click options
     */
    async click(
        locator: Locator,
        options?: {
            timeout?: number;
            force?: boolean;
            button?: 'left' | 'right' | 'middle';
            clickCount?: number;
            delay?: number;
            position?: { x: number; y: number };
            modifiers?: Array<'Alt' | 'Control' | 'Meta' | 'Shift'>;
            trial?: boolean;
        }
    ): Promise<void> {
        const timeout = options?.timeout ?? this.defaultTimeout;

        return this.executeWithRetry(async () => {
            await this.ensureActionable(locator, timeout);

            // Pre-check: element must be enabled (unless force-clicking)
            if (!options?.force) {
                const disabled = await locator.isDisabled();
                if (disabled) {
                    throw new Error('Element is disabled and cannot be clicked');
                }
            }

            await locator.click({
                timeout,
                force: options?.force,
                button: options?.button,
                clickCount: options?.clickCount,
                delay: options?.delay,
                position: options?.position,
                modifiers: options?.modifiers,
                trial: options?.trial,
            });
        }, `click(${locator})`);
    }

    /**
     * Double-click with full actionability checks.
     * @param locator - Element locator
     * @param options - Double-click options
     */
    async dblclick(
        locator: Locator,
        options?: {
            timeout?: number;
            force?: boolean;
            position?: { x: number; y: number };
            modifiers?: Array<'Alt' | 'Control' | 'Meta' | 'Shift'>;
        }
    ): Promise<void> {
        const timeout = options?.timeout ?? this.defaultTimeout;

        return this.executeWithRetry(async () => {
            await this.ensureActionable(locator, timeout);
            await locator.dblclick({
                timeout,
                force: options?.force,
                position: options?.position,
                modifiers: options?.modifiers,
            });
        }, `dblclick(${locator})`);
    }

    /**
     * Fill an input/textarea. Playwright's fill() already clears existing content.
     * Pre-checks: visible, enabled, editable.
     * @param locator - Element locator
     * @param value - Value to fill into the input
     * @param options - Fill options
     */
    async fill(
        locator: Locator,
        value: string,
        options?: {
            timeout?: number;
            force?: boolean;
            validate?: boolean;
        }
    ): Promise<void> {
        const timeout = options?.timeout ?? this.defaultTimeout;

        return this.executeWithRetry(async () => {
            await this.ensureActionable(locator, timeout);

            if (!options?.force) {
                const disabled = await locator.isDisabled();
                if (disabled) {
                    throw new Error('Element is disabled and cannot be filled');
                }
                const editable = await locator.isEditable();
                if (!editable) {
                    throw new Error('Element is not editable');
                }
            }

            // Playwright's fill() clears existing value, then sets new value
            await locator.fill(value, { timeout, force: options?.force });

            // Optional post-fill validation (default: true for input/textarea)
            if (options?.validate !== false) {
                const actual = await locator.inputValue().catch(() => null);
                if (actual !== null && actual !== value) {
                    throw new Error(
                        `Fill verification failed: expected "${value}", got "${actual}"`
                    );
                }
            }
        }, `fill(${locator})`);
    }

    /**
     * Type character-by-character with delay. Useful for autocomplete/search fields.
     * Unlike fill(), this triggers keydown/keypress/keyup events for each character.
     * @param locator - Element locator
     * @param text - Text to type character by character
     * @param options - Type options
     */
    async type(
        locator: Locator,
        text: string,
        options?: {
            timeout?: number;
            delay?: number;
            clearFirst?: boolean;
        }
    ): Promise<void> {
        const timeout = options?.timeout ?? this.defaultTimeout;

        return this.executeWithRetry(async () => {
            await this.ensureActionable(locator, timeout);

            if (options?.clearFirst !== false) {
                await locator.clear({ timeout });
            }

            await locator.pressSequentially(text, {
                timeout,
                delay: options?.delay ?? 50,
            });
        }, `type(${locator})`);
    }

    /**
     * Get text content (including hidden descendants) with auto-wait for visibility.
     * Returns empty string instead of throwing when element has no text.
     * @param locator - Element locator
     * @param options - Options for text retrieval
     */
    async getText(
        locator: Locator,
        options?: {
            timeout?: number;
            trim?: boolean;
        }
    ): Promise<string> {
        const timeout = options?.timeout ?? this.defaultTimeout;

        return this.executeWithRetry(async () => {
            await this.waitForState(locator, 'visible', timeout);

            const text = await locator.textContent({ timeout });

            // Return empty string for null (element exists but has no text nodes)
            const result = text ?? '';
            return options?.trim !== false ? result.trim() : result;
        }, `getText(${locator})`);
    }

    /**
     * Get visible inner text only (respects CSS visibility).
     * @param locator - Element locator
     * @param options - Options for text retrieval
     */
    async getInnerText(
        locator: Locator,
        options?: {
            timeout?: number;
            trim?: boolean;
        }
    ): Promise<string> {
        const timeout = options?.timeout ?? this.defaultTimeout;

        return this.executeWithRetry(async () => {
            await this.waitForState(locator, 'visible', timeout);
            const text = await locator.innerText({ timeout });
            return options?.trim !== false ? text.trim() : text;
        }, `getInnerText(${locator})`);
    }

    /**
     * Get attribute value. Waits for element to be attached (not necessarily visible).
     * @param locator - Element locator
     * @param attributeName - Name of the attribute to retrieve
     * @param options - Options for attribute retrieval
     */
    async getAttribute(
        locator: Locator,
        attributeName: string,
        options?: {
            timeout?: number;
        }
    ): Promise<string | null> {
        const timeout = options?.timeout ?? this.defaultTimeout;

        return this.executeWithRetry(async () => {
            await this.waitForState(locator, 'attached', timeout);
            return await locator.getAttribute(attributeName, { timeout });
        }, `getAttribute("${attributeName}", ${locator})`);
    }

    /**
     * Get current input/textarea value.
     * @param locator - Element locator
     * @param options - Options for input value retrieval
     */
    async getInputValue(
        locator: Locator,
        options?: { timeout?: number }
    ): Promise<string> {
        const timeout = options?.timeout ?? this.defaultTimeout;

        return this.executeWithRetry(async () => {
            await this.waitForState(locator, 'attached', timeout);
            return await locator.inputValue({ timeout });
        }, `getInputValue(${locator})`);
    }

    // ─── State Check Methods ────────────────────────────────────────────────────
    // These use a shorter timeout (stateCheckTimeout) so they return quickly.
    // They never throw — they return a boolean.

    /**
     * Returns true if element is enabled. Uses short timeout to avoid long blocking.
     * @param locator - Element locator
     * @param options - Options with optional timeout override
     */
    async isEnabled(
        locator: Locator,
        options?: { timeout?: number }
    ): Promise<boolean> {
        const timeout = options?.timeout ?? this.stateCheckTimeout;
        try {
            await locator.waitFor({ state: 'attached', timeout });
            return await locator.isEnabled();
        } catch {
            return false;
        }
    }

    /**
     * Returns true if element is disabled.
     * @param locator - Element locator
     * @param options - Options with optional timeout override
     */
    async isDisabled(
        locator: Locator,
        options?: { timeout?: number }
    ): Promise<boolean> {
        const timeout = options?.timeout ?? this.stateCheckTimeout;
        try {
            await locator.waitFor({ state: 'attached', timeout });
            return await locator.isDisabled();
        } catch {
            return false;
        }
    }

    /**
     * Returns true if element is visible in the DOM.
     * Returns false immediately if element is not found within timeout.
     * @param locator - Element locator
     * @param options - Options with optional timeout override
     */
    async isVisible(
        locator: Locator,
        options?: { timeout?: number }
    ): Promise<boolean> {
        const timeout = options?.timeout ?? this.stateCheckTimeout;
        try {
            await locator.waitFor({ state: 'visible', timeout });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Returns true if element is hidden or not in the DOM.
     * @param locator - Element locator
     * @param options - Options with optional timeout override
     */
    async isHidden(
        locator: Locator,
        options?: { timeout?: number }
    ): Promise<boolean> {
        const timeout = options?.timeout ?? this.stateCheckTimeout;
        try {
            await locator.waitFor({ state: 'hidden', timeout });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Returns true if element is editable (not disabled, not readonly).
     * @param locator - Element locator
     * @param options - Options with optional timeout override
     */
    async isEditable(
        locator: Locator,
        options?: { timeout?: number }
    ): Promise<boolean> {
        const timeout = options?.timeout ?? this.stateCheckTimeout;
        try {
            await locator.waitFor({ state: 'attached', timeout });
            return await locator.isEditable();
        } catch {
            return false;
        }
    }

    /**
     * Returns true if element is checked (checkbox/radio).
     * @param locator - Element locator
     * @param options - Options with optional timeout override
     */
    async isChecked(
        locator: Locator,
        options?: { timeout?: number }
    ): Promise<boolean> {
        const timeout = options?.timeout ?? this.stateCheckTimeout;
        try {
            await locator.waitFor({ state: 'attached', timeout });
            return await locator.isChecked();
        } catch {
            return false;
        }
    }

    /**
     * Returns true if element exists in the DOM (attached).
     * @param locator - Element locator
     * @param options - Options with optional timeout and state override
     */
    async exists(
        locator: Locator,
        options?: { timeout?: number; state?: 'attached' | 'visible' }
    ): Promise<boolean> {
        const timeout = options?.timeout ?? this.stateCheckTimeout;
        try {
            await locator.waitFor({ state: options?.state ?? 'attached', timeout });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Returns number of elements matching the locator (instant, no wait).
     * @param locator - Element locator
     */
    async count(locator: Locator): Promise<number> {
        return await locator.count();
    }

    // ─── Wait Helpers ───────────────────────────────────────────────────────────

    /**
     * Wait for element to become visible.
     * @param locator - Element locator
     * @param timeout - Custom timeout in milliseconds (optional)
     */
    async waitForVisible(locator: Locator, timeout?: number): Promise<void> {
        await this.waitForState(locator, 'visible', timeout);
    }

    /**
     * Wait for element to become hidden or detached.
     * @param locator - Element locator
     * @param timeout - Custom timeout in milliseconds (optional)
     */
    async waitForHidden(locator: Locator, timeout?: number): Promise<void> {
        await this.waitForState(locator, 'hidden', timeout);
    }

    /**
     * Wait for element to be attached to DOM.
     * @param locator - Element locator
     * @param timeout - Custom timeout in milliseconds (optional)
     */
    async waitForAttached(locator: Locator, timeout?: number): Promise<void> {
        await this.waitForState(locator, 'attached', timeout);
    }

    /**
     * Wait for element to be detached from DOM.
     * @param locator - Element locator
     * @param timeout - Custom timeout in milliseconds (optional)
     */
    async waitForDetached(locator: Locator, timeout?: number): Promise<void> {
        await this.waitForState(locator, 'detached', timeout);
    }

    /**
     * Wait for the page to reach a stable load state.
     * @param state - Load state to wait for: 'load' | 'domcontentloaded' | 'networkidle'
     */
    async waitForPageReady(
        state: 'load' | 'domcontentloaded' | 'networkidle' = 'domcontentloaded'
    ): Promise<void> {
        await this.page.waitForLoadState(state);
    }

    // ─── Additional Action Methods ──────────────────────────────────────────────

    /**
     * Hover over element with auto-wait.
     * @param locator - Element locator
     * @param options - Hover options
     */
    async hover(
        locator: Locator,
        options?: {
            timeout?: number;
            force?: boolean;
            position?: { x: number; y: number };
            modifiers?: Array<'Alt' | 'Control' | 'Meta' | 'Shift'>;
        }
    ): Promise<void> {
        const timeout = options?.timeout ?? this.defaultTimeout;

        return this.executeWithRetry(async () => {
            await this.ensureActionable(locator, timeout);
            await locator.hover({
                timeout,
                force: options?.force,
                position: options?.position,
                modifiers: options?.modifiers,
            });
        }, `hover(${locator})`);
    }

    /**
     * Select option(s) from a <select> element.
     * @param locator - Element locator for the select element
     * @param values - Value(s) to select (string, array, or object with value/label/index)
     * @param options - Select options
     */
    async selectOption(
        locator: Locator,
        values: string | string[] | { value?: string; label?: string; index?: number },
        options?: { timeout?: number; force?: boolean }
    ): Promise<string[]> {
        const timeout = options?.timeout ?? this.defaultTimeout;

        return this.executeWithRetry(async () => {
            await this.ensureActionable(locator, timeout);
            return await locator.selectOption(values, { timeout, force: options?.force });
        }, `selectOption(${locator})`);
    }

    /**
     * Check a checkbox/radio. No-op if already checked.
     * @param locator - Element locator
     * @param options - Check options
     */
    async check(
        locator: Locator,
        options?: { timeout?: number; force?: boolean }
    ): Promise<void> {
        const timeout = options?.timeout ?? this.defaultTimeout;

        return this.executeWithRetry(async () => {
            await this.ensureActionable(locator, timeout);
            await locator.check({ timeout, force: options?.force });
        }, `check(${locator})`);
    }

    /**
     * Uncheck a checkbox. No-op if already unchecked.
     * @param locator - Element locator
     * @param options - Uncheck options
     */
    async uncheck(
        locator: Locator,
        options?: { timeout?: number; force?: boolean }
    ): Promise<void> {
        const timeout = options?.timeout ?? this.defaultTimeout;

        return this.executeWithRetry(async () => {
            await this.ensureActionable(locator, timeout);
            await locator.uncheck({ timeout, force: options?.force });
        }, `uncheck(${locator})`);
    }

    /**
     * Focus an element.
     * @param locator - Element locator
     * @param options - Focus options
     */
    async focus(locator: Locator, options?: { timeout?: number }): Promise<void> {
        const timeout = options?.timeout ?? this.defaultTimeout;

        return this.executeWithRetry(async () => {
            await this.waitForState(locator, 'visible', timeout);
            await locator.focus({ timeout });
        }, `focus(${locator})`);
    }

    /**
     * Press a keyboard key on a focused element.
     * @param locator - Element locator
     * @param key - Key to press (e.g., 'Enter', 'Tab', 'ArrowDown', 'Control+A')
     * @param options - Press options
     */
    async press(
        locator: Locator,
        key: string,
        options?: { timeout?: number; delay?: number }
    ): Promise<void> {
        const timeout = options?.timeout ?? this.defaultTimeout;

        return this.executeWithRetry(async () => {
            await this.waitForState(locator, 'visible', timeout);
            await locator.press(key, { timeout, delay: options?.delay });
        }, `press("${key}", ${locator})`);
    }
}

export function createPlaywrightUtil(page: Page, options?: {
    defaultTimeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    stateCheckTimeout?: number;
}): PlayWrightUtil {
    return new PlayWrightUtil(page, options);
}
