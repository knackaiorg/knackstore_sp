package com.knack.store.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class CartDTO {
    private Long id;
    private List<CartEntryDTO> entries;
    private Double totalPrice;
    private int totalItems;

    @Data
    @Builder
    public static class CartEntryDTO {
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
    public static class AddEntryRequest {
        private Long productId;
        private Long variantId;
        private int quantity;
    }

    @Data
    public static class UpdateEntryRequest {
        private int quantity;
    }
}
