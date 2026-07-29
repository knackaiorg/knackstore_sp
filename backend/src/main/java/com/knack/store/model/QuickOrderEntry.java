package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "quick_order_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuickOrderEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String sessionId;

    @Column(nullable = false)
    private String skuCode;

    @Column(nullable = false)
    private String productName;

    private Double price;

    @Column(nullable = false)
    private int quantity;

    private int availableStock;

    @Builder.Default
    private boolean valid = true;

    private String errorMessage;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
