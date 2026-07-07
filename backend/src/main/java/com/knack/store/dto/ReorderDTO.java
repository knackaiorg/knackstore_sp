package com.knack.store.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO for Reorder requests and responses.
 * Request: Contains the orderCode to reorder.
 * Response: Contains the updated cart after reordering.
 */
@Data
public class ReorderDTO {
    
    @Data
    public static class ReorderRequest {
        private String orderCode;  // The order to reorder from
    }
    
    @Data
    @Builder
    public static class ReorderResponse {
        private Boolean success;
        private String message;
        private CartDTO updatedCart;      // The cart after reordering
        private int itemsAdded;           // Number of items added to cart
        private int itemsUnavailable;     // Number of items that couldn't be added (out of stock)
    }
}

