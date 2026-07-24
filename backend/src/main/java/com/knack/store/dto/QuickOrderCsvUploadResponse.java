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
public class QuickOrderCsvUploadResponse {

    private String sessionId;
    private int totalRows;
    private int validCount;
    private int errorCount;
    private List<StagingItem> stagingItems;
    private List<ErrorItem> errors;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StagingItem {
        private Long entryId;
        private String skuCode;
        private String productName;
        private Double price;
        private int quantity;
        private int availableStock;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ErrorItem {
        private int rowNumber;
        private String skuCode;
        private String productName;
        private int quantity;
        private String reason;
        private String message;
    }
}
