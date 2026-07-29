package com.knack.store.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class SavedCartDTO {

    @Data
    @Builder
    public static class SavedCartSummary {
        private Long id;
        private String cartNumber;
        private String cartName;
        private int skuCount;
        private Double totalPrice;
        private LocalDateTime savedAt;
    }

    @Data
    @Builder
    public static class SavedCartDetail {
        private Long id;
        private String cartNumber;
        private String cartName;
        private int skuCount;
        private Double totalPrice;
        private LocalDateTime savedAt;
        private List<SavedCartEntryDetail> entries;
    }

    @Data
    @Builder
    public static class SavedCartEntryDetail {
        private Long entryId;
        private Long productId;
        private String productCode;
        private String productName;
        private String productImageUrl;
        private Long variantId;
        private String variantSku;
        private String variantDescription;
        private int quantity;
        private Double unitPrice;
        private Double lineTotal;
    }

    @Data
    @Builder
    public static class AddSavedCartToCartResponse {
        private boolean success;
        private String message;
        private int itemsAdded;
        private int itemsUnavailable;
        private List<String> unavailableItems;
        private CartDTO updatedCart;
    }

    @Data
    public static class SaveCartRequest {
        private String cartName;
        private Long targetSavedCartId;
    }
}
