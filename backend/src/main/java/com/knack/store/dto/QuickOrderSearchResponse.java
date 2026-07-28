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
public class QuickOrderSearchResponse {

    private List<ProductResult> results;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductResult {
        private Long productId;
        private String skuCode;
        private String productName;
        private String brand;
        private String imageUrl;
        private Double price;
        private int availableStock;
        private boolean inStock;
    }
}
