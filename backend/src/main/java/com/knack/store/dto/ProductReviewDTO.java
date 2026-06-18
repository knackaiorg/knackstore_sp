package com.knack.store.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

public class ProductReviewDTO {

    @Data
    public static class SubmitReviewRequest {
        @NotNull
        @Min(1)
        @Max(5)
        private Integer rating;

        @Size(max = 2000)
        private String comment;
    }

    @Data
    @Builder
    public static class ProductReviewResponse {
        private Long id;
        private Long productId;
        private Integer rating;
        private String comment;
        private String reviewerName;
        private LocalDateTime createdAt;
    }
}
