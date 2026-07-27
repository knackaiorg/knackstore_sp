package com.knack.store.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Return Order requests and responses
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnOrderDTO {

    private Long id;
    private String returnCode;
    private String orderCode;
    private String status;
    private String returnType;  // FULL or PARTIAL
    private String returnReason;
    private Double refundAmount;
    private LocalDateTime requestedDate;
    private LocalDateTime processedDate;
    private LocalDateTime completedDate;
    private Boolean itemsReceived;
    private LocalDateTime itemsReceivedDate;
    private String returnTrackingNumber;
    private String adminNotes;
    private List<ReturnOrderEntryDTO> returnEntries;

    /**
     * Request DTO for creating a return order
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateReturnOrderRequest {
        /**
         * Order code to return
         */
        private String orderCode;

        /**
         * Type of return: FULL or PARTIAL
         */
        private String returnType;

        /**
         * Reason for return (Dropdown values):
         * - DEFECT_PRODUCT: Product is defective (auto-completes without admin approval)
         * - NOT_AS_DESCRIBED: Item not as described in listing
         * - CHANGED_MIND: Customer changed their mind
         * - NO_LONGER_NEEDED: No longer needed
         * - WRONG_ITEM_RECEIVED: Received wrong item
         * - DAMAGED_IN_SHIPPING: Item damaged during shipping
         * - OTHER: Other reason
         */
        private String returnReason;

        /**
         * For partial returns - list of order entry IDs and quantities to return
         */
        private List<ReturnEntryRequest> returnEntries;

        /**
         * Return tracking number (optional, provided by customer)
         */
        private String returnTrackingNumber;
    }

    /**
     * DTO for individual return entry in request
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReturnEntryRequest {
        /**
         * Order Entry ID to return
         */
        private Long orderEntryId;

        /**
         * Quantity to return
         */
        private int quantityToReturn;

        /**
         * Condition of item: UNOPENED, OPENED, USED, DAMAGED, OTHER
         */
        private String itemCondition;

        /**
         * Notes about the item
         */
        private String notes;
    }

    /**
     * Response DTO for return request
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateReturnOrderResponse {
        private boolean success;
        private String message;
        private String returnCode;
        private String status;
        private Double estimatedRefund;
    }

    /**
     * Request for approving/rejecting return
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProcessReturnRequest {
        /**
         * APPROVED or REJECTED
         */
        private String status;

        /**
         * Admin notes about the return
         */
        private String adminNotes;

        /**
         * Refund amount (can override calculated amount)
         */
        private Double refundAmount;
    }

    /**
     * Request for marking return items as received
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MarkItemsReceivedRequest {
        /**
         * Whether items were received
         */
        private Boolean itemsReceived;

        /**
         * Notes about received items
         */
        private String notes;
    }
}

