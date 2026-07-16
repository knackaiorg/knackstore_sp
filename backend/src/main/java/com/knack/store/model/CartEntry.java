package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "cart_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id")
    private Cart cart;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    private int quantity;

    private Double unitPrice;

    // Expiry of this line item's inventory hold; null once released/expired.
    private LocalDateTime reservedUntil;

    // Set false once a hold expires unrenewed; blocks checkout until the entry is removed and re-added.
    @Builder.Default
    private boolean validForCheckout = true;
}
