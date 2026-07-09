package com.knack.store.repository;

import com.knack.store.model.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    List<ProductReview> findByProductIdAndApprovedTrueOrderByCreatedAtDesc(Long productId);

    long countByProductIdAndApprovedTrue(Long productId);

    boolean existsByProductIdAndCustomerId(Long productId, Long customerId);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM ProductReview r WHERE r.product.id = :productId AND r.approved = true")
    Double averageRatingByProductId(@Param("productId") Long productId);
}
