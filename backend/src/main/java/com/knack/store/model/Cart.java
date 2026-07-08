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

    public Double getTotalPrice() {
        return entries.stream()
                .mapToDouble(e -> e.getQuantity() * e.getUnitPrice())
                .sum();
    }

    public int getTotalItems() {
        return entries.stream().mapToInt(CartEntry::getQuantity).sum();
    }
}
