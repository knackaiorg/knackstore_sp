/**
 * Test data configuration for PDP Low Stock Badge feature.
 * Each test case uses its own isolated data set to support parallel execution.
 *
 * Actual badge format observed from the app:
 *   - "In Stock (X)" with class "badge bg-success" when X > 10
 *   - "Low Stock (X)" with class "badge bg-warning" when 4 <= X <= 10
 *   - "Only X left!" with class "badge bg-danger" when 1 <= X <= 3
 *   - "Out of Stock" with class "badge bg-danger" when X = 0
 */
export class PdpStockBadgeDataConfig {

  // ─── Login Credentials ───────────────────────────────────────────────────
  static readonly BASE_URL = 'http://localhost:4200';
  static readonly LOGIN_URL = 'http://localhost:4200/login';
  static readonly LOGIN_EMAIL = 'demo@knack.com';
  static readonly LOGIN_PASSWORD = 'Demo@1234';

  // ─── Product URLs ────────────────────────────────────────────────────────
  static readonly PDP_BASE_URL = 'http://localhost:4200/products';
  static readonly PRODUCT_ID = '1';

  static readonly PDP_URL = `${PdpStockBadgeDataConfig.PDP_BASE_URL}/${PdpStockBadgeDataConfig.PRODUCT_ID}`;
  static readonly PLP_URL = 'http://localhost:4200/products';

  // ─── Badge Class Patterns ────────────────────────────────────────────────
  static readonly BADGE_CLASS_SUCCESS = 'bg-success';
  static readonly BADGE_CLASS_WARNING = 'bg-warning';
  static readonly BADGE_CLASS_DANGER = 'bg-danger';

  // ─── Badge Text Patterns (regex) ─────────────────────────────────────────
  static readonly BADGE_IN_STOCK_PATTERN = /In Stock \(\d+\)/;
  static readonly BADGE_LOW_STOCK_PATTERN = /Low Stock \(\d+\)/;
  static readonly BADGE_CRITICAL_STOCK_PATTERN = /Only \d+ left!/;
  static readonly BADGE_OUT_OF_STOCK_TEXT = 'Out of Stock';
  static readonly BADGE_STOCK_OR_LEFT_PATTERN = /Stock|left/;
  static readonly BADGE_QUANTITY_PATTERN = /\(\d+\)|Out of Stock|left/;
  static readonly BADGE_NUMERIC_PATTERN = /\d+|Out of Stock/;
  static readonly BADGE_ANY_DIGIT_PATTERN = /\d+/;

  // ─── TC-01: Stock badge visible — verify badge element exists on PDP ─────
  static readonly TC01_EXPECTED_BADGE_PATTERN = /Stock|left/;

  // ─── TC-02: Badge class is warning (orange) when qty is 4–9 ──────────────
  static readonly TC02_EXPECTED_CLASS = 'bg-warning';

  // ─── TC-03: Badge class is danger (red) when qty is 1–3 ──────────────────
  static readonly TC03_EXPECTED_CLASS = 'bg-danger';

  // ─── TC-04: Out of Stock text and cart disabled ───────────────────────────
  static readonly TC04_EXPECTED_OUT_OF_STOCK_TEXT = 'Out of Stock';

  // ─── TC-06: Variant switch — actual variant names from product 1 ─────────
  static readonly TC06_VARIANT_A = 'Midnight Black';
  static readonly TC06_VARIANT_B = 'Silver';

  // ─── TC-07: Default colour (success) when qty > 10 ───────────────────────
  static readonly TC07_EXPECTED_CLASS = 'bg-success';

  // ─── TC-10: Race condition error message ─────────────────────────────────
  static readonly TC10_EXPECTED_ERROR_MESSAGE = 'Out of Stock';
}
