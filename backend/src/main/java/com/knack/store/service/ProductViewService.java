package com.knack.store.service;

import com.knack.store.dto.ProductDTO;
import com.knack.store.dto.ProductViewDTO;
import com.knack.store.model.Product;
import com.knack.store.model.ProductView;
import com.knack.store.repository.ProductRepository;
import com.knack.store.repository.ProductViewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductViewService {

    private final ProductViewRepository productViewRepository;
    private final ProductRepository productRepository;
    private static final int MAX_RECENT_PRODUCTS = 10;

    /**
     * Log a product view for a guest session
     * If the product was already viewed, update the timestamp and increment view count
     * Otherwise, create a new ProductView record
     *
     * @param guestSessionId Unique guest session identifier
     * @param productId      ID of the product being viewed
     * @return LogProductViewResponse with view details
     */
    public ProductViewDTO.LogProductViewResponse logProductView(String guestSessionId, Long productId) {
        // Validate product exists
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        LocalDateTime now = LocalDateTime.now();

        // Check if this product was already viewed in this session
        var existingView = productViewRepository.findByGuestSessionIdAndProductId(guestSessionId, productId);

        ProductView productView;
        if (existingView.isPresent()) {
            // Update existing view: move to front by updating timestamp, increment count
            productView = existingView.get();
            productView.setViewedAt(now);
            productView.setViewCount(productView.getViewCount() + 1);
        } else {
            // Create new product view record
            productView = ProductView.builder()
                    .guestSessionId(guestSessionId)
                    .product(product)
                    .viewedAt(now)
                    .viewCount(1)
                    .build();
        }

        productView = productViewRepository.save(productView);

        // Clean up old views if exceeding MAX_RECENT_PRODUCTS
        cleanupOldViews(guestSessionId);

        return ProductViewDTO.LogProductViewResponse.builder()
                .productViewId(productView.getId())
                .productId(productId)
                .viewedAt(productView.getViewedAt())
                .message("Product view logged successfully")
                .build();
    }

    /**
     * Get recently viewed products for a guest session (max 10)
     * Returns products ordered by most recent first
     *
     * @param guestSessionId Unique guest session identifier
     * @return RecentlyViewedResponse containing list of recently viewed products
     */
    @Transactional(readOnly = true)
    public ProductViewDTO.RecentlyViewedResponse getRecentlyViewed(String guestSessionId) {
        // Fetch up to MAX_RECENT_PRODUCTS views, ordered by most recent
        Pageable pageable = PageRequest.of(0, MAX_RECENT_PRODUCTS);
        List<ProductView> views = productViewRepository
                .findByGuestSessionIdOrderByViewedAtDesc(guestSessionId, pageable);

        // Get total count for response
        long totalCount = productViewRepository.countByGuestSessionId(guestSessionId);

        // Convert to response items
        List<ProductViewDTO.RecentlyViewedResponse.RecentProductItem> items = views.stream()
                .map(view -> ProductViewDTO.RecentlyViewedResponse.RecentProductItem.builder()
                        .id(view.getId())
                        .productId(view.getProduct().getId())
                        .productCode(view.getProduct().getCode())
                        .productName(view.getProduct().getName())
                        .productImage(view.getProduct().getImageUrl())
                        .productPrice(view.getProduct().getBasePrice())
                        .viewedAt(view.getViewedAt())
                        .build())
                .collect(Collectors.toList());

        return ProductViewDTO.RecentlyViewedResponse.builder()
                .guestSessionId(guestSessionId)
                .totalViewCount((int) totalCount)
                .returnedCount(items.size())
                .products(items)
                .build();
    }

    /**
     * Get recently viewed products with full ProductDTO details
     * Used when you need complete product information
     *
     * @param guestSessionId Unique guest session identifier
     * @return List of ProductViewDTO containing full product details
     */
    @Transactional(readOnly = true)
    public List<ProductViewDTO> getRecentlyViewedWithDetails(String guestSessionId) {
        Pageable pageable = PageRequest.of(0, MAX_RECENT_PRODUCTS);
        List<ProductView> views = productViewRepository
                .findByGuestSessionIdOrderByViewedAtDesc(guestSessionId, pageable);

        return views.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Clear all viewed products for a guest session
     *
     * @param guestSessionId Unique guest session identifier
     */
    public void clearRecentlyViewed(String guestSessionId) {
        productViewRepository.deleteByGuestSessionId(guestSessionId);
    }

    /**
     * Internal method: Remove old views if exceeding MAX_RECENT_PRODUCTS
     * Keeps only the most recent MAX_RECENT_PRODUCTS views
     *
     * @param guestSessionId Unique guest session identifier
     */
    private void cleanupOldViews(String guestSessionId) {
        long totalViews = productViewRepository.countByGuestSessionId(guestSessionId);

        if (totalViews > MAX_RECENT_PRODUCTS) {
            // Get all views ordered by most recent
            List<ProductView> allViews = productViewRepository
                    .findByGuestSessionIdOrderByViewedAtDesc(guestSessionId);

            // Delete the oldest views beyond MAX_RECENT_PRODUCTS
            List<ProductView> toDelete = allViews.stream()
                    .skip(MAX_RECENT_PRODUCTS)
                    .collect(Collectors.toList());

            if (!toDelete.isEmpty()) {
                productViewRepository.deleteAll(toDelete);
            }
        }
    }

    /**
     * Convert ProductView entity to ProductViewDTO
     */
    private ProductViewDTO toDTO(ProductView view) {
        Product p = view.getProduct();
        ProductDTO productDTO = ProductDTO.builder()
                .id(p.getId())
                .code(p.getCode())
                .name(p.getName())
                .description(p.getDescription())
                .brand(p.getBrand())
                .basePrice(p.getBasePrice())
                .imageUrl(p.getImageUrl())
                .featured(p.isFeatured())
                .averageRating(p.getAverageRating())
                .reviewCount(p.getReviewCount())
                .stockQuantity(p.getStockQuantity())
                .category(p.getCategory() != null ? ProductDTO.CategoryDTO.builder()
                        .id(p.getCategory().getId())
                        .code(p.getCategory().getCode())
                        .name(p.getCategory().getName())
                        .imageUrl(p.getCategory().getImageUrl())
                        .build() : null)
                .build();

        return ProductViewDTO.builder()
                .id(view.getId())
                .guestSessionId(view.getGuestSessionId())
                .product(productDTO)
                .viewedAt(view.getViewedAt())
                .viewCount(view.getViewCount())
                .build();
    }
}

