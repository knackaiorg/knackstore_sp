Reviews & Ratings Implementation

Overview
- Purpose: Allow authenticated customers to submit 1–5 star ratings and optional comments for products, and to display approved reviews and aggregated ratings on product pages.
- Scope: Frontend (Angular) UI + components and services; Backend (Spring Boot) REST endpoints, validation, persistence, and product rating aggregation.

Backend

1) Endpoints
- GET /api/products/{productId}/reviews
  - Returns: ReviewListWsDTO { reviews, totalCount, averageRating }
  - Public: no authentication required for listing approved reviews.
- GET /api/products/{productId}/reviews/me
  - Returns: ReviewEligibilityDTO { alreadyReviewed: boolean }
  - Requires authentication; used to determine if current customer may submit a review.
- POST /api/products/{productId}/reviews
  - Req body: SubmitReviewRequest { rating: Integer(1..5), comment?: String }
  - Requires authentication; creates a review for the authenticated customer and returns ReviewWsDTO.

2) DTOs and Validation
- SubmitReviewRequest
  - rating: @NotNull, @Min(1), @Max(5)
  - comment: @Size(max=2000)
- ReviewWsDTO
  - id, productId, rating, comment, reviewerName, createdAt
- ReviewListWsDTO
  - reviews[], totalCount, averageRating
- ReviewEligibilityDTO
  - alreadyReviewed boolean

3) Persistence and Constraints
- Entity: `ProductReview` (table `product_reviews`)
  - Fields: id, product (FK), customer (FK), rating (int), comment, approved (bool), createdAt
  - Unique constraint: (product_id, customer_id) to prevent duplicate reviews per customer
  - `@PrePersist` sets createdAt and defaults for approved.
- Repository methods (via `ProductReviewRepository` / DAO)
  - find approved reviews newest-first, count approved reviews, check if user reviewed, compute average rating

4) Service logic (ReviewService)
- submitReview(email, productId, rating, comment)
  - Resolves customer and product; checks if already reviewed (via DAO) and throws 409 if so
  - Builds and saves ProductReview (approved by default)
  - Calls refreshProductRatingStats(product) to recompute total count and average, then saves product
  - Returns populated ReviewWsDTO via a populator
- getProductReviews(productId)
  - Validates product exists; returns list of approved reviews + aggregated stats
- getReviewEligibility(email, productId)
  - Checks if the customer already reviewed the product

5) Security
- Submission and eligibility endpoints require authentication (controller checks @AuthenticationPrincipal and returns 401 when missing).

Frontend

1) Models
- `SubmitProductReviewRequest` { rating: number; comment?: string }
- `ReviewWsDTO`, `ReviewListWsDTO`, `ReviewEligibilityDTO` mirror backend structures
- Product model includes `averageRating` and `reviewCount` to show summary data on the product page

2) Service
- `ProductReviewService` (singleton Angular service)
  - getProductReviews(productId): GET `${apiUrl}/products/${productId}/reviews`
  - getReviewEligibility(productId): GET `${apiUrl}/products/${productId}/reviews/me`
  - submitReview(productId, request): POST `${apiUrl}/products/${productId}/reviews`
  - Uses typed RxJS Observables and `HttpClient` (environment.apiUrl is base)

3) UI components
- `StarRatingComponent` (shared)
  - Inputs: `rating` (number), `count` (number)
  - Displays 5 stars, filled according to Math.round(rating), shows rating value and review count
- `ProductDetailComponent`
  - Loads product data and calls `loadReviews(productId)` on init
  - `loadReviews` calls `ProductReviewService.getProductReviews` and sets `reviews`, `averageRating`, `totalReviewCount`
  - If user is authenticated, calls `getReviewEligibility` to set `alreadyReviewed`
  - Review form state: `reviewRating`, `reviewComment`, `submittingReview`, `reviewError`, `reviewSuccessMessage`
  - `submitReview()` validation: requires star rating selected; posts using `productReviewService.submitReview`
  - On success: prepends returned review to local `reviews` array, updates local `product.reviewCount` and `product.averageRating` (optimistic UI update), clears form and sets `alreadyReviewed = true`
  - On error: shows server message or generic error

4) UX details and constraints
- Only authenticated users may submit reviews; the frontend checks `AuthService.isLoggedIn` and the backend enforces authentication.
- The star control is visually separate (`app-star-rating`) and re-used across product list and detail views.
- Client enforces basic UI validation (rating selected). The server enforces rating bounds and comment length.
- After submitting a review, the frontend updates product summary (averageRating, reviewCount) without reloading the entire product, using a simple recomputation.

Integration Notes
- API base: `environment.apiUrl` — ensure proxy or CORS is configured during local development so the Angular app can reach the Spring Boot backend.
- H2 console available at `/h2-console` for debugging stored reviews (in-memory DB by default in dev profile).

Testing and Edge Cases
- Duplicate submissions: prevented at DB unique constraint + service check -> returns 409 Conflict when detected.
- Concurrency: service recomputes product stats after saving a review — for high concurrency you may want to compute aggregates in a single DB operation.
- Moderation: current implementation sets `approved = true` by default; switch to `false` + moderation flow if reviews should be moderated.

Files of interest
- Backend: `src/main/java/com/knack/store/reviews/controller/ReviewsController.java`
- Backend DTOs: `src/main/java/com/knack/store/reviews/dto/SubmitReviewRequest.java`, `ReviewWsDTO.java`, `ReviewListWsDTO.java`
- Backend entity: `src/main/java/com/knack/store/model/ProductReview.java`
- Backend service/DAO: `src/main/java/com/knack/store/reviews/service/ReviewService.java`, `reviews/dao/ReviewDao.java`, `repository/ProductReviewRepository.java`
- Frontend: `src/app/core/services/product-review.service.ts`, `src/app/shared/components/star-rating/star-rating.component.ts`, `src/app/pages/product-detail/product-detail.component.ts`

Next steps / suggestions
- Add server-side pagination for long review lists and expose page/size on `GET .../reviews`.
- Add a PUT/DELETE for customers to update/delete their own reviews (with additional checks).
- Consider storing aggregate fields (reviewCount, averageRating) in the database with a scheduled job or DB trigger for consistency under load.

-- End of document
