package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "promo_codes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromoCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiscountType discountType;

    @Column(nullable = false)
    private Double discountValue;

    private Double minimumOrderAmount;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    public enum DiscountType {
        PERCENTAGE,
        FIXED
    }

    public double calculateDiscount(double cartSubtotal) {
        if (discountType == DiscountType.PERCENTAGE) {
            return cartSubtotal * (discountValue / 100.0);
        } else {
            return Math.min(discountValue, cartSubtotal);
        }
    }
}
