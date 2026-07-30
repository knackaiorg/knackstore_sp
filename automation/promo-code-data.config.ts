/**
 * Test data configuration for Promo Code feature.
 * Pre-seeded promo codes from the Testing Guide.
 *
 * Available codes:
 *   - FIRST15  → Percentage, 15%, no minimum (best for testing)
 *   - WELCOME10 → Percentage, 10%, min ₹500
 *   - SAVE20   → Percentage, 20%, min ₹1,000
 *   - FLAT500  → Fixed, ₹500, min ₹2,000
 *   - MEGA1000 → Fixed, ₹1,000, min ₹5,000
 */
export class PromoCodeDataConfig {

  // ─── Login Credentials ───────────────────────────────────────────────────
  static readonly BASE_URL = 'http://localhost:4200';
  static readonly LOGIN_URL = 'http://localhost:4200/login';
  static readonly LOGIN_EMAIL = 'demo@knack.com';
  static readonly LOGIN_PASSWORD = 'Demo@1234';

  // ─── Page URLs ───────────────────────────────────────────────────────────
  static readonly CART_URL = 'http://localhost:4200/cart';
  static readonly PRODUCTS_URL = 'http://localhost:4200/products';

  // ─── Pre-seeded Promo Codes ──────────────────────────────────────────────
  static readonly PROMO_FIRST15 = 'FIRST15';
  static readonly PROMO_WELCOME10 = 'WELCOME10';
  static readonly PROMO_SAVE20 = 'SAVE20';
  static readonly PROMO_FLAT500 = 'FLAT500';
  static readonly PROMO_MEGA1000 = 'MEGA1000';
  static readonly PROMO_INVALID = 'INVALID123';

  // ─── Success Messages ────────────────────────────────────────────────────
  static readonly SUCCESS_APPLIED = /Promo code applied successfully/;
  static readonly SUCCESS_REMOVED = /Promo code removed successfully/;

  // ─── Error Messages ──────────────────────────────────────────────────────
  static readonly ERROR_INVALID_CODE = /This promo code is not valid/;
  static readonly ERROR_ALREADY_APPLIED = /A promo code is already applied/;
  static readonly ERROR_MIN_CART_VALUE = /This code requires a minimum cart value/;
  static readonly ERROR_EMPTY_FIELD = /Please enter a promo code/;

  // ─── TC-PC-001: Apply valid percentage code (no minimum) ─────────────────
  static readonly TC01_CODE = PromoCodeDataConfig.PROMO_FIRST15;
  static readonly TC01_EXPECTED_SUCCESS = PromoCodeDataConfig.SUCCESS_APPLIED;
  static readonly TC01_DISCOUNT_PERCENT = 15;

  // ─── TC-PC-002: Apply valid percentage code with minimum met ─────────────
  static readonly TC02_CODE = PromoCodeDataConfig.PROMO_SAVE20;
  static readonly TC02_EXPECTED_SUCCESS = PromoCodeDataConfig.SUCCESS_APPLIED;
  static readonly TC02_MIN_CART_VALUE = 1000;
  static readonly TC02_DISCOUNT_PERCENT = 20;

  // ─── TC-PC-003: Remove promo code ────────────────────────────────────────
  static readonly TC03_CODE = PromoCodeDataConfig.PROMO_FIRST15;
  static readonly TC03_EXPECTED_REMOVED = PromoCodeDataConfig.SUCCESS_REMOVED;

  // ─── TC-PC-004: Apply code when below minimum (use MEGA1000 — min ₹5000) ──
  static readonly TC04_CODE = PromoCodeDataConfig.PROMO_MEGA1000;
  static readonly TC04_EXPECTED_ERROR = PromoCodeDataConfig.ERROR_MIN_CART_VALUE;

  // ─── TC-PC-005: Apply second code when one already applied ───────────────
  static readonly TC05_FIRST_CODE = PromoCodeDataConfig.PROMO_WELCOME10;
  static readonly TC05_SECOND_CODE = PromoCodeDataConfig.PROMO_SAVE20;
  static readonly TC05_EXPECTED_ERROR = PromoCodeDataConfig.ERROR_ALREADY_APPLIED;

  // ─── TC-PC-006: Apply invalid/non-existent code ──────────────────────────
  static readonly TC06_CODE = PromoCodeDataConfig.PROMO_INVALID;
  static readonly TC06_EXPECTED_ERROR = PromoCodeDataConfig.ERROR_INVALID_CODE;

  // ─── TC-PC-007: Verify promo code UI elements are displayed ──────────────
  // (No extra data needed — uses existing locators)

  // ─── TC-PC-008: Checkout without promo code ──────────────────────────────
  // (No promo code needed — verifies checkout proceeds without applying promo)

  // ─── TC-PC-009: Remove promo and apply a different one ───────────────────
  static readonly TC09_FIRST_CODE = PromoCodeDataConfig.PROMO_FIRST15;
  static readonly TC09_SECOND_CODE = PromoCodeDataConfig.PROMO_SAVE20;

  // ─── TC-PC-010: Spaces in promo code rejected (alphanumeric only) ──────
  static readonly TC10_CODE_WITH_SPACES = '  FIRST15  ';
  static readonly TC10_EXPECTED_ERROR = /only letters and numbers/i;
}
