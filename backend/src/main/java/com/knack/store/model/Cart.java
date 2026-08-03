package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "carts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CartEntry> entries = new ArrayList<>();

    private String appliedPromoCode;

    @Builder.Default
    private Double discountAmount = 0.0;

    // Loyalty points currently redeemed against this cart (reserved from the customer's balance until
    // the order is placed or the redemption is removed/replaced).
    @Builder.Default
    private Integer redeemedPoints = 0;

    @Builder.Default
    private Double pointsDiscountAmount = 0.0;

    public Double getSubtotal() {
        return entries.stream()
                .mapToDouble(e -> e.getQuantity() * e.getUnitPrice())
                .sum();
    }

    public Double getTotalPrice() {
        double promo = discountAmount != null ? discountAmount : 0.0;
        double points = pointsDiscountAmount != null ? pointsDiscountAmount : 0.0;
        return Math.max(0, getSubtotal() - promo - points);
    }

    public int getTotalItems() {
        return entries.stream().mapToInt(CartEntry::getQuantity).sum();
    }
}
