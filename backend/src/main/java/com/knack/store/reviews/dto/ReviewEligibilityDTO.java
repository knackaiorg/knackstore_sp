package com.knack.store.reviews.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReviewEligibilityDTO {
    private boolean alreadyReviewed;
}
