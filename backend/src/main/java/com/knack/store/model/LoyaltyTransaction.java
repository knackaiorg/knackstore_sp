package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "loyalty_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoyaltyTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private LoyaltyAccount account;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Type type;

    // Signed change applied to the balance: positive for EARNED/BONUS/REFUNDED, negative for REDEEMED.
    @Column(nullable = false)
    private Integer points;

    private String orderCode;

    private String description;

    @Builder.Default
    private LocalDateTime createdDate = LocalDateTime.now();

    public enum Type {
        EARNED,
        REDEEMED,
        REFUNDED,
        BONUS
    }
}
