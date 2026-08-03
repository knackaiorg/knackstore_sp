package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "loyalty_accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoyaltyAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", unique = true, nullable = false)
    private Customer customer;

    @Builder.Default
    @Column(nullable = false)
    private Integer pointsBalance = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer lifetimePointsEarned = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer lifetimePointsRedeemed = 0;

    private LocalDateTime lastModifiedDate;
}
