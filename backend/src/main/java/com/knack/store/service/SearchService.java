package com.knack.store.service;

import com.knack.store.dto.SearchDTO;
import com.knack.store.model.Category;
import com.knack.store.model.Product;
import com.knack.store.model.SearchLog;
import com.knack.store.repository.CategoryRepository;
import com.knack.store.repository.ProductRepository;
import com.knack.store.repository.SearchLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    // US-01: no suggestions below 2 characters
    private static final int MIN_QUERY_LENGTH = 2;

    // US-02: 8-10 suggestions total, weighted ~2-3 products + the rest categories/brands
    private static final int MAX_TOTAL_SUGGESTIONS = 8;
    private static final int MAX_PRODUCT_SUGGESTIONS = 3;
    private static final int MAX_CATEGORY_SUGGESTIONS = 3;

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SearchLogRepository searchLogRepository;

    public SearchDTO.SuggestionsResponse getSuggestions(String rawQuery) {
        String query = rawQuery == null ? "" : rawQuery.trim();
        String lowerQuery = query.toLowerCase();

        // US-01 / US-09: below the trigger length, or nothing matches, return empty lists.
        // The frontend simply doesn't render a dropdown when everything is empty.
        if (query.length() < MIN_QUERY_LENGTH) {
            return SearchDTO.SuggestionsResponse.builder()
                    .products(List.of())
                    .categories(List.of())
                    .brands(List.of())
                    .build();
        }

        List<Product> productCandidates = productRepository.findTop10ByNameContainingIgnoreCase(query)
                .stream()
                .filter(p -> p.getName() != null && p.getName().toLowerCase().contains(lowerQuery))
                .collect(Collectors.toList());
        List<Category> categoryCandidates = categoryRepository.findByNameContainingIgnoreCase(query);
        List<String> brandCandidates = productRepository.findDistinctBrandsContaining(query);

        // US-07: rank by a combination of text relevance (does the name start with the
        // query vs. just contain it) and recent popularity (click/search frequency).
        // Popularity starts at zero for everything until real usage data accumulates —
        // this is the intended v1 behaviour; the exact relevance/popularity weighting
        // was flagged as an open item for technical design in the user stories.
        List<Product> rankedProducts = productCandidates.stream()
                .sorted(Comparator
                        .comparingInt((Product p) -> relevanceRank(p.getName(), p.getBrand(), query))
                        .thenComparing((Product p) -> -popularity("PRODUCT", p.getId()))
                        .thenComparing((Product p) -> -p.getReviewCount()))
                .limit(MAX_PRODUCT_SUGGESTIONS)
                .collect(Collectors.toList());

        List<Category> rankedCategories = categoryCandidates.stream()
                .sorted(Comparator
                        .comparingInt((Category c) -> relevanceRank(c.getName(), null, query))
                        .thenComparing((Category c) -> -popularity("CATEGORY", c.getId())))
                .limit(MAX_CATEGORY_SUGGESTIONS)
                .collect(Collectors.toList());

        List<String> rankedBrands = brandCandidates.stream()
                .sorted(Comparator.comparingInt((String b) -> relevanceRank(b, null, query))
                        .thenComparing(Comparator.naturalOrder()))
                .collect(Collectors.toList());

        // Fill remaining slots up to MAX_TOTAL_SUGGESTIONS: products first, then
        // categories, then brands, then top up with any leftover products/categories
        // if the total is still under budget (e.g. a very specific query with few
        // category/brand matches should still show more product results).
        int budget = MAX_TOTAL_SUGGESTIONS;

        List<Product> finalProducts = take(rankedProducts, Math.min(MAX_PRODUCT_SUGGESTIONS, budget));
        budget -= finalProducts.size();

        List<Category> finalCategories = take(rankedCategories, Math.min(MAX_CATEGORY_SUGGESTIONS, budget));
        budget -= finalCategories.size();

        List<String> finalBrands = take(rankedBrands, budget);
        budget -= finalBrands.size();

        if (budget > 0 && finalProducts.size() < rankedProducts.size()) {
            List<Product> extra = rankedProducts.subList(finalProducts.size(),
                    Math.min(rankedProducts.size(), finalProducts.size() + budget));
            finalProducts = new ArrayList<>(finalProducts);
            finalProducts.addAll(extra);
        }

        return SearchDTO.SuggestionsResponse.builder()
                .products(finalProducts.stream().map(this::toProductSuggestion).collect(Collectors.toList()))
                .categories(finalCategories.stream().map(this::toCategorySuggestion).collect(Collectors.toList()))
                .brands(finalBrands.stream()
                        .map(b -> SearchDTO.BrandSuggestion.builder().name(b).build())
                        .collect(Collectors.toList()))
                .build();
    }

    public void logEvent(SearchDTO.LogSearchEventRequest request) {
        // US-12: query text + action only, deliberately no customer/session/IP captured.
        SearchLog log = SearchLog.builder()
                .queryText(request.getQueryText())
                .eventType(request.getEventType())
                .suggestionType(request.getSuggestionType())
                .referenceId(request.getReferenceId())
                .build();
        searchLogRepository.save(log);
    }

    // Rank by: 0 = name starts with query (highest)
    //          1 = brand starts with query (or name contains)
    //          2 = brand contains query
    //          3 = nothing matches start (lowest)
    private int relevanceRank(String name, String brand, String query) {
        if (name != null && name.toLowerCase().startsWith(query.toLowerCase())) {
            return 0; // name starts with query — highest relevance
        }
        if (brand != null && brand.toLowerCase().startsWith(query.toLowerCase())) {
            return 1; // brand starts with query
        }
        if (name != null && name.toLowerCase().contains(query.toLowerCase())) {
            return 1; // name contains query
        }
        if (brand != null && brand.toLowerCase().contains(query.toLowerCase())) {
            return 2; // brand contains query
        }
        return 3; // no match (shouldn't happen)
    }

    private long popularity(String suggestionType, Long referenceId) {
        return searchLogRepository.countByEventTypeAndSuggestionTypeAndReferenceId(
                "SUGGESTION_CLICK", suggestionType, referenceId);
    }

    private <T> List<T> take(List<T> list, int n) {
        if (n <= 0) return new ArrayList<>();
        return new ArrayList<>(list.subList(0, Math.min(n, list.size())));
    }

    private SearchDTO.ProductSuggestion toProductSuggestion(Product p) {
        return SearchDTO.ProductSuggestion.builder()
                .id(p.getId())
                .name(p.getName())
                .imageUrl(p.getImageUrl())
                .price(p.getBasePrice())
                .build();
    }

    private SearchDTO.CategorySuggestion toCategorySuggestion(Category c) {
        return SearchDTO.CategorySuggestion.builder()
                .id(c.getId())
                .code(c.getCode())
                .name(c.getName())
                .imageUrl(c.getImageUrl())
                .build();
    }
}