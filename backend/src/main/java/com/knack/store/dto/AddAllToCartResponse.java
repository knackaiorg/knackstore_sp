package com.knack.store.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddAllToCartResponse {

    private int totalItems;
    private int addedCount;
    private int failedCount;
    private List<AddedItem> addedItems;
    private List<FailedItem> failedItems;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddedItem {
        private Long entryId;
        private String skuCode;
        private String productName;
        private int quantity;
        private Double unitPrice;
        private boolean mergedWithExisting;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FailedItem {
        private Long entryId;
        private String skuCode;
        private String productName;
        private int quantity;
        private String reason;
        private String message;
    }
}
