package com.knack.store.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class WishlistDTO {
    private Long id;
    private int totalItems;
    private List<WishlistEntryDTO> entries;

    @Data
    @Builder
    public static class WishlistEntryDTO {
        private Long entryId;
        private LocalDateTime addedAt;
        private Long productId;
        private String productCode;
        private String productName;
        private String productImageUrl;
        private Double price;
        private Long variantId;
        private String variantSku;
        private String variantDescription;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ToggleEntryRequest {
        private Long productId;
        private Long variantId;
    }
}
