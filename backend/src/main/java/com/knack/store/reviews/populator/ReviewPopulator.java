package com.knack.store.reviews.populator;

import com.knack.store.model.ProductReview;
import com.knack.store.reviews.dto.ReviewWsDTO;
import org.springframework.stereotype.Component;

@Component
public class ReviewPopulator {

    public ReviewWsDTO populate(ProductReview review) {
        if (review == null) {
            return null;
        }
        return ReviewWsDTO.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .reviewerName(getReviewerName(review))
                .createdAt(review.getCreatedAt())
                .build();
    }

    private String getReviewerName(ProductReview review) {
        return "Customer";
    }
}
