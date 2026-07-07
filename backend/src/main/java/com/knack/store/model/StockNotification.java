package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "STOCK_NOTIFICATION",
        uniqueConstraints = {
                @UniqueConstraint(name = "UK_USER_SKU", columnNames = {"USER_ID", "SKU"})
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "USER_ID", nullable = false)
    private Long userId;

    @Column(name = "SKU", nullable = false)
    private String sku;

    @Column(name = "EMAIL", nullable = false)
    private String email;

    @Column(name = "NOTIFICATION_STATUS", nullable = false, length = 20)
    private String notificationStatus;

    @Column(name = "SUBSCRIBED_AT", nullable = false)
    private LocalDateTime subscribedAt;

    @Column(name = "NOTIFIED_AT")
    private LocalDateTime notifiedAt;

    @PrePersist
    public void prePersist() {
        if (notificationStatus == null || notificationStatus.isBlank()) {
            notificationStatus = "PENDING";
        }
        if (subscribedAt == null) {
            subscribedAt = LocalDateTime.now();
        }
    }
}

