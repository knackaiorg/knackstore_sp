# Product Carousel Component – Implementation Documentation

## Overview

A reusable, configurable carousel component (`ProductCarouselComponent`) was created and integrated into the `RecentlyViewedProductsComponent`. It provides responsive product visibility, navigation arrows, position indicators (dots), and touch/swipe gesture support.

---

## Implementation Steps

### Step 1: Created `ProductCarouselComponent`

**Location:** `frontend/src/app/shared/components/product-carousel/`

Files created:
- `product-carousel.component.ts` – Component logic (navigation, responsive breakpoints, swipe handling)
- `product-carousel.component.html` – Template with track, arrows, and dot indicators
- `product-carousel.component.css` – Responsive styles for all breakpoints

### Step 2: Configurable Inputs

The carousel accepts the following `@Input()` properties:

| Input         | Type       | Default       | Description                          |
|---------------|------------|---------------|--------------------------------------|
| `products`    | `Product[]`| `[]`          | Array of products to display         |
| `title`       | `string`   | `'Products'`  | Section heading                      |
| `viewAllLink` | `string`   | `'/products'` | Route for "View All" button          |
| `showViewAll` | `boolean`  | `true`        | Show/hide the "View All" button      |

### Step 3: Position Indicators (Dots)

- Indicators are rendered at the bottom of the carousel
- Total dots = `ceil(products.length / visibleCount)`
- Active dot is highlighted with a filled blue style and scaled up
- Each dot is a `<button>` with `role="tab"` and `aria-label` for accessibility
- Clicking a dot navigates to that page of products
- Indicators update automatically when arrows or swipe navigation changes the position

### Step 4: Responsive Product Visibility

Breakpoints configured in `calculateVisibleCount()`:

| Breakpoint       | Window Width    | Products Visible |
|------------------|-----------------|------------------|
| Mobile           | < 576px         | 2                |
| Small Tablet     | 576px – 767px   | 2                |
| Tablet           | 768px – 991px   | 3                |
| Desktop          | 992px – 1199px  | 4                |
| Large Desktop    | ≥ 1200px        | 5                |

Uses `ResizeObserver` + `window:resize` HostListener for live recalculation.

### Step 5: Navigation Arrows

- Left (`‹`) and Right (`›`) arrow buttons positioned at vertical center
- Conditionally shown only when navigation in that direction is possible (`*ngIf="canGoPrev"` / `*ngIf="canGoNext"`)
- Styled with shadow, hover effects (blue fill), and responsive sizing
- Keyboard accessible: Left/Right arrow keys navigate when carousel is focused

### Step 6: Touch/Swipe Gesture Support

- `touchstart` records starting X position
- `touchmove` tracks current X position
- `touchend` calculates swipe distance; if > 50px threshold, triggers `next()` or `prev()`
- Works naturally on mobile and tablet touch screens

### Step 7: Accessibility

- Carousel wrapper has `role="region"` and `aria-label`
- `tabindex="0"` allows keyboard focus
- Arrow keys navigate slides when focused
- Dots have `role="tab"` and `aria-selected` attributes
- Focus-visible outline for keyboard users

### Step 8: Integrated into RecentlyViewedProducts

The `RecentlyViewedProductsComponent` template was updated to use `<app-product-carousel>` instead of a static grid layout. The component still handles data fetching; the carousel handles presentation.

### Step 9: Registered in AppModule

`ProductCarouselComponent` was added to `declarations` in `AppModule` and its import statement was added alongside other shared components.

---

## File Changes Summary

| File | Action |
|------|--------|
| `shared/components/product-carousel/product-carousel.component.ts` | Created |
| `shared/components/product-carousel/product-carousel.component.html` | Created |
| `shared/components/product-carousel/product-carousel.component.css` | Created |
| `shared/components/recently-viewed-products/recently-viewed-products.component.html` | Updated to use carousel |
| `app.module.ts` | Added import & declaration |

---

## Usage Example

```html
<app-product-carousel
  [products]="myProducts"
  [title]="'Recently Viewed Products'"
  [viewAllLink]="'/products'"
  [showViewAll]="true">
</app-product-carousel>
```

---

## Future Enhancements

- Auto-play with configurable interval
- Infinite loop mode
- Lazy loading of off-screen product cards
- Custom animation timing via `@Input()`
- Integration with actual "recently viewed" tracking API
