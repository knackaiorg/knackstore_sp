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

    public Double getSubtotal() {
        return entries.stream()
                .mapToDouble(e -> e.getQuantity() * e.getUnitPrice())
                .sum();
    }

    public Double getTotalPrice() {
        return Math.max(0, getSubtotal() - (discountAmount != null ? discountAmount : 0.0));
    }

    public int getTotalItems() {
        return entries.stream().mapToInt(CartEntry::getQuantity).sum();
    }
}
