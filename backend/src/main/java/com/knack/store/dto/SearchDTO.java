package com.knack.store.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

import java.util.List;

public class SearchDTO {

    @Data
    @Builder
    public static class ProductSuggestion {
        private Long id;
        private String name;
        private String imageUrl;
        private Double price;
    }

    @Data
    @Builder
    public static class CategorySuggestion {
        private Long id;
        private String code;
        private String name;
        private String imageUrl;
    }

    @Data
    @Builder
    public static class BrandSuggestion {
        private String name;
    }

    @Data
    @Builder
    public static class SuggestionsResponse {
        private List<ProductSuggestion> products;
        private List<CategorySuggestion> categories;
        private List<BrandSuggestion> brands;
    }

    @Data
    public static class LogSearchEventRequest {
        @NotBlank
        private String queryText;

        @NotBlank
        private String eventType; // SEARCH_SUBMIT | SUGGESTION_CLICK

        private String suggestionType; // PRODUCT | CATEGORY | BRAND (only for SUGGESTION_CLICK)

        private Long referenceId; // product/category id (only for SUGGESTION_CLICK)
    }
}
