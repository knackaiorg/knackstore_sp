package com.knack.store.reviews.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReviewWsDTO {
    private Long id;
    private Long productId;
    private Integer rating;
    private String comment;
    private String reviewerName;
    private LocalDateTime createdAt;
}
