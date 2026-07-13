package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_recommendations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String sourceProductCode;

    @Column(nullable = false)
    private String recommendedProductCode;

    private int coPurchaseCount;
}

