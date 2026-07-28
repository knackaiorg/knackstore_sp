export class TestConfig {
  appURL = "http://localhost:4200/"
  homepageURL = "http://localhost:4200/"
  productsURL = "http://localhost:4200/products"
  loginURL = "http://localhost:4200/login"
  cartURL = "http://localhost:4200/cart"
  username = "demo@knack.com"
  password = "Demo@1234"

  // Recently Viewed limits
  maxRecentlyViewedItems = 10

  // Product IDs for test navigation (based on available products)
  productIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

  // localStorage key used by the application
  localStorageKey = "recently_viewed_products"
}
