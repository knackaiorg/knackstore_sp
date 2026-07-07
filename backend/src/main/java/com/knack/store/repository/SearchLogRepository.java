package com.knack.store.repository;

import com.knack.store.model.SearchLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SearchLogRepository extends JpaRepository<SearchLog, Long> {

    // Popularity signal for ranking (US-07): how many times this specific
    // product/category has been searched for or clicked as a suggestion.
    // Starts at 0 for everything until real usage accumulates — ranking
    // gracefully falls back to pure text relevance until then.
    long countByEventTypeAndSuggestionTypeAndReferenceId(String eventType, String suggestionType, Long referenceId);
}
