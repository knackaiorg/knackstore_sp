package com.knack.store.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for product view tracking
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductViewDTO {

    private Long id;

    private String guestSessionId;

    private ProductDTO product;

    private LocalDateTime viewedAt;

    private int viewCount;

    public static ProductViewDTOBuilder builder() {
        return new ProductViewDTOBuilder();
    }

    public static class ProductViewDTOBuilder {
        private Long id;
        private String guestSessionId;
        private ProductDTO product;
        private LocalDateTime viewedAt;
        private int viewCount;

        ProductViewDTOBuilder() {
        }

        public ProductViewDTOBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public ProductViewDTOBuilder guestSessionId(String guestSessionId) {
            this.guestSessionId = guestSessionId;
            return this;
        }

        public ProductViewDTOBuilder product(ProductDTO product) {
            this.product = product;
            return this;
        }

        public ProductViewDTOBuilder viewedAt(LocalDateTime viewedAt) {
            this.viewedAt = viewedAt;
            return this;
        }

        public ProductViewDTOBuilder viewCount(int viewCount) {
            this.viewCount = viewCount;
            return this;
        }

        public ProductViewDTO build() {
            ProductViewDTO dto = new ProductViewDTO();
            dto.id = this.id;
            dto.guestSessionId = this.guestSessionId;
            dto.product = this.product;
            dto.viewedAt = this.viewedAt;
            dto.viewCount = this.viewCount;
            return dto;
        }
    }

    /**
     * Request DTO for logging a product view
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LogProductViewRequest {
        private String guestSessionId;
        private Long productId;
    }

    /**
     * Response DTO for confirming a logged view
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LogProductViewResponse {
        private Long productViewId;
        private Long productId;
        private LocalDateTime viewedAt;
        private String message;

        public static LogProductViewResponseBuilder builder() {
            return new LogProductViewResponseBuilder();
        }

        public static class LogProductViewResponseBuilder {
            private Long productViewId;
            private Long productId;
            private LocalDateTime viewedAt;
            private String message;

            LogProductViewResponseBuilder() {
            }

            public LogProductViewResponseBuilder productViewId(Long productViewId) {
                this.productViewId = productViewId;
                return this;
            }

            public LogProductViewResponseBuilder productId(Long productId) {
                this.productId = productId;
                return this;
            }

            public LogProductViewResponseBuilder viewedAt(LocalDateTime viewedAt) {
                this.viewedAt = viewedAt;
                return this;
            }

            public LogProductViewResponseBuilder message(String message) {
                this.message = message;
                return this;
            }

            public LogProductViewResponse build() {
                return new LogProductViewResponse(this.productViewId, this.productId, this.viewedAt, this.message);
            }
        }
    }

    /**
     * Response DTO for recently viewed products list
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentlyViewedResponse {
        private String guestSessionId;
        private int totalViewCount;
        private int returnedCount;
        private java.util.List<RecentProductItem> products;

        public static RecentlyViewedResponseBuilder builder() {
            return new RecentlyViewedResponseBuilder();
        }

        public static class RecentlyViewedResponseBuilder {
            private String guestSessionId;
            private int totalViewCount;
            private int returnedCount;
            private java.util.List<RecentProductItem> products;

            RecentlyViewedResponseBuilder() {
            }

            public RecentlyViewedResponseBuilder guestSessionId(String guestSessionId) {
                this.guestSessionId = guestSessionId;
                return this;
            }

            public RecentlyViewedResponseBuilder totalViewCount(int totalViewCount) {
                this.totalViewCount = totalViewCount;
                return this;
            }

            public RecentlyViewedResponseBuilder returnedCount(int returnedCount) {
                this.returnedCount = returnedCount;
                return this;
            }

            public RecentlyViewedResponseBuilder products(java.util.List<RecentProductItem> products) {
                this.products = products;
                return this;
            }

            public RecentlyViewedResponse build() {
                return new RecentlyViewedResponse(this.guestSessionId, this.totalViewCount, this.returnedCount, this.products);
            }
        }

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class RecentProductItem {
            private Long id;
            private Long productId;
            private String productCode;
            private String productName;
            private String productImage;
            private Double productPrice;
            private LocalDateTime viewedAt;
        }
    }
}

