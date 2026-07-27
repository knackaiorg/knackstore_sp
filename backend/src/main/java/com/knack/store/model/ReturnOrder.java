package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a return request for an order.
 * 
 * A ReturnOrder captures:
 * - Which order is being returned
 * - Which customer initiated the return
 * - Current status of the return (PENDING, APPROVED, REJECTED, COMPLETED)
 * - Reason for return
 * - When the return was requested and processed
 */
@Entity
@Table(name = "return_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String returnCode;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    /**
     * Status of the return request:
     * PENDING - Awaiting review
     * APPROVED - Return approved by admin
     * REJECTED - Return rejected
     * COMPLETED - Return completed and refunded
     */
    @Column(nullable = false)
    private String status;

    /**
     * Type of return:
     * FULL - Entire order is being returned
     * PARTIAL - Only selected items are being returned
     */
    @Column(nullable = false)
    private String returnType;

    /**
     * Reason for return provided by customer
     */
    @Column(length = 2000)
    private String returnReason;

    /**
     * Additional comments/notes
     */
    @Column(length = 2000)
    private String adminNotes;

    /**
     * Individual items being returned
     */
    @OneToMany(mappedBy = "returnOrder", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ReturnOrderEntry> returnEntries = new ArrayList<>();

    /**
     * Refund amount to be issued
     */
    private Double refundAmount;

    /**
     * When the return was requested
     */
    @Column(nullable = false)
    private LocalDateTime requestedDate;

    /**
     * When the return was approved/processed
     */
    private LocalDateTime processedDate;

    /**
     * When the return was completed
     */
    private LocalDateTime completedDate;

    /**
     * When the return record was last updated
     */
    private LocalDateTime lastModifiedDate;

    /**
     * Whether return items were received by the store
     */
    private Boolean itemsReceived;

    /**
     * Date when returned items were received
     */
    private LocalDateTime itemsReceivedDate;

    /**
     * Tracking number for return shipment
     */
    private String returnTrackingNumber;
}

