package com.knack.store.reviews.dao;

import com.knack.store.model.ProductReview;
import com.knack.store.repository.ProductReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class ReviewDao {

    private final ProductReviewRepository repository;

    public List<ProductReview> findApprovedByProductIdNewestFirst(Long productId) {
        return repository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(productId);
    }

    public long countApprovedByProductId(Long productId) {
        return repository.countByProductIdAndApprovedTrue(productId);
    }

    public Double getAverageRatingByProductId(Long productId) {
        return repository.averageRatingByProductId(productId);
    }

    public boolean hasUserReviewedProduct(Long productId, Long customerId) {
        return repository.existsByProductIdAndCustomerId(productId, customerId);
    }

    public ProductReview save(ProductReview review) {
        return repository.save(review);
    }

    public ProductReview findById(Long reviewId) {
        return repository.findById(reviewId).orElse(null);
    }

    public void delete(ProductReview review) {
        repository.delete(review);
    }
}
