package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entity representing a single item in a return request.
 * 
 * Links a ReturnOrder to specific OrderEntries being returned.
 * Tracks quantity, refund amount per item, and condition of returned items.
 */
@Entity
@Table(name = "return_order_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnOrderEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "return_order_id")
    private ReturnOrder returnOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_entry_id")
    private OrderEntry orderEntry;

    /**
     * Quantity being returned
     */
    private int quantityReturned;

    /**
     * Refund amount for this item
     */
    private Double refundAmount;

    /**
     * Condition of the returned item:
     * UNOPENED - Never opened
     * OPENED - Opened but unused
     * USED - Used but in good condition
     * DAMAGED - Damaged
     * OTHER - Other condition
     */
    @Column(length = 50)
    private String itemCondition;

    /**
     * Additional notes about this specific item
     */
    @Column(length = 1000)
    private String notes;

    // Keep legacy fields for backward compatibility
    private String productCode;
    private int quantity;
    private String returnReason;
    private Double totalPrice;
    private String condition;
}

