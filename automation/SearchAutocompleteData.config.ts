export class TestConfig {
  /** Base URL of the KnackStore frontend under test. */
  appURL = "http://localhost:4200/";

  // ─── Search Autocomplete test data (mock) ───────────────────────────────────
  // Values below are mock/placeholder data aligned with the seeded catalog in
  // backend DataInitializer.java. Adjust if the seed data changes.

  /** TC-01 (US-01): a 2-character query that matches seeded catalog data.
   *  "Al" matches brand "AlphaTech" / product "AlphaPhone Pro 15". */
  matchingTwoCharQuery = "bo";

  /** TC-05 (US-03): a term that surfaces a product suggestion. */
  productQuery = "book";

  /** TC-05 (US-03): visible name of the expected product suggestion. */
  productSuggestionName = "UltraBook Pro 14";

  /** TC-05 (US-03): route fragment identifying a Product Detail Page (/products/:id). */
  pdpUrlPattern = "/products/";

  /** TC-05 (US-03): query fragment identifying the search results page (/products?search=). */
  searchResultsUrlPattern = "search=";

  /** TC-06 (US-04): a term that surfaces a category suggestion. */
  categoryQuery = "la";

  /** TC-06 (US-04): visible name of the expected category suggestion. */
  categorySuggestionName = "laptops";

  /** TC-06 (US-04): query fragment identifying the category-filtered PLP (/products?category=). */
  plpUrlPattern = "/products?category=laptops";

  /** TC-12 (US-09): a deterministic term guaranteed to return zero matches. */
  noMatchQuery = "No Match Query";
}
