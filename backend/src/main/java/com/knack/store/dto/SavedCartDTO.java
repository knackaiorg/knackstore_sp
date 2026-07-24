package com.knack.store.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class SavedCartDTO {
    private Long id;
    private String cartNumber;
    private int skuCount;
    private double totalPrice;
    private LocalDateTime createdAt;
    private String message;
    private List<SavedCartEntryDTO> entries;

    @Data
    @Builder
    public static class SavedCartEntryDTO {
        private Long entryId;
        private Long productId;
        private String productCode;
        private String productName;
        private String productImageUrl;
        private Long variantId;
        private String variantSku;
        private String variantDescription;
        private int quantity;
        private double unitPrice;
        private double lineTotal;
    }
}
