package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "order_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    private String productCode;
    private String productName;
    private String variantSku;
    private String variantDescription;
    private int quantity;
    private Double unitPrice;
    private Double totalPrice;
    private Boolean eligibleForReturn;
}
