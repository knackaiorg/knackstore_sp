package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;

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

    @Column(nullable = false, unique = true)
    private String cartNumber;

    @Column(nullable = false)
    private String cartName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false)
    private LocalDateTime savedAt;

    @Builder.Default
    @OneToMany(mappedBy = "savedCart", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SavedCartEntry> entries = new ArrayList<>();

    private int skuCount;

    private Double totalPrice;

    @PrePersist
    void prePersist() {
        if (savedAt == null) {
            savedAt = LocalDateTime.now();
        }
    }
}
