package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "questions",
        uniqueConstraints = @UniqueConstraint(name = "uk_question_product_customer", columnNames = {"product_id", "customer_id"}),
        indexes = {
                @Index(name = "idx_question_product_created_at", columnList = "product_id, created_at"),
                @Index(name = "idx_question_customer", columnList = "customer_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false, length = 200)
    private String questionText;

    @Column(nullable = false)
    @Builder.Default
    private boolean answered = false;

    @OneToOne(mappedBy = "question", fetch = FetchType.LAZY)
    private Answer answer;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

