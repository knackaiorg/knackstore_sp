package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_views")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Guest session identifier (UUID generated client-side)
     * Used to track views for anonymous users
     */
    @Column(nullable = false)
    private String guestSessionId;

    /**
     * Product that was viewed
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /**
     * Timestamp when the product was last viewed
     */
    @Column(nullable = false)
    private LocalDateTime viewedAt;

    /**
     * Number of times this product has been viewed in this session
     */
    @Column(nullable = false)
    @Builder.Default
    private int viewCount = 1;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getGuestSessionId() {
        return guestSessionId;
    }

    public void setGuestSessionId(String guestSessionId) {
        this.guestSessionId = guestSessionId;
    }

    public LocalDateTime getViewedAt() {
        return viewedAt;
    }

    public void setViewedAt(LocalDateTime viewedAt) {
        this.viewedAt = viewedAt;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public int getViewCount() {
        return viewCount;
    }

    public void setViewCount(int viewCount) {
        this.viewCount = viewCount;
    }

    /**
     * Create a new ProductView builder instance
     * Used for constructing ProductView objects with fluent API
     * 
     * @return ProductViewBuilder
     */
    public static ProductViewBuilder builder() {
        return new ProductViewBuilder();
    }

    /**
     * ProductViewBuilder - Fluent builder for ProductView entity
     */
    public static class ProductViewBuilder {
        private Long id;
        private String guestSessionId;
        private Product product;
        private LocalDateTime viewedAt;
        private int viewCount = 1;

        ProductViewBuilder() {
        }

        public ProductViewBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public ProductViewBuilder guestSessionId(String guestSessionId) {
            this.guestSessionId = guestSessionId;
            return this;
        }

        public ProductViewBuilder product(Product product) {
            this.product = product;
            return this;
        }

        public ProductViewBuilder viewedAt(LocalDateTime viewedAt) {
            this.viewedAt = viewedAt;
            return this;
        }

        public ProductViewBuilder viewCount(int viewCount) {
            this.viewCount = viewCount;
            return this;
        }

        public ProductView build() {
            return new ProductView(this.id, this.guestSessionId, this.product, this.viewedAt, this.viewCount);
        }

        @Override
        public String toString() {
            return "ProductView.ProductViewBuilder(id=" + this.id + ", guestSessionId=" + this.guestSessionId 
                    + ", product=" + this.product + ", viewedAt=" + this.viewedAt + ", viewCount=" + this.viewCount + ")";
        }
    }
}

