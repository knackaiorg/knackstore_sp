package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "saved_cart_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedCartEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "saved_cart_id", nullable = false)
    private SavedCart savedCart;

    private Long productId;

    private String productCode;

    private String productName;

    private String productImageUrl;

    private Long variantId;

    private String variantSku;

    private String variantDescription;

    private int quantity;

    private Double unitPrice;

    public Double getLineTotal() {
        return quantity * (unitPrice != null ? unitPrice : 0.0);
    }
}
