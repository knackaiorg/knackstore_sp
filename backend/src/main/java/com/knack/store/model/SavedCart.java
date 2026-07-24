package com.knack.store.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "saved_carts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedCart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String cartNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "savedCart", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SavedCartEntry> entries = new ArrayList<>();

    public int getSkuCount() {
        return entries.size();
    }

    public double getTotalPrice() {
        return entries.stream()
                .mapToDouble(entry -> entry.getQuantity() * entry.getUnitPrice())
                .sum();
    }
}
