package com.knack.store.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Return Order Entry (individual item in a return)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnOrderEntryDTO {

    private Long id;

    /**
     * Original order entry information
     */
    private Long orderEntryId;
    private String productCode;
    private String productName;
    private int quantity;
    private Double unitPrice;

    /**
     * Return information
     */
    private int quantityReturned;
    private Double refundAmount;
    private String itemCondition;  // UNOPENED, OPENED, USED, DAMAGED, OTHER
    private String notes;
}

