package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "search_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The raw text the customer typed (search submit) or the text of the
    // suggestion they clicked. Deliberately NOT linked to Customer — US-12
    // requires no PII in these logs, just the query and the action taken.
    @Column(nullable = false, length = 500)
    private String queryText;

    // SEARCH_SUBMIT | SUGGESTION_CLICK
    @Column(nullable = false)
    private String eventType;

    // PRODUCT | CATEGORY | BRAND — only set when eventType is SUGGESTION_CLICK
    private String suggestionType;

    // ID of the product/category clicked, when applicable. Used to compute
    // popularity for ranking future suggestions (US-07). Null for brand
    // clicks and for plain search submits.
    private Long referenceId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
