package com.knack.store.repository;

import com.knack.store.model.ProductRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRecommendationRepository extends JpaRepository<ProductRecommendation, Long> {
    List<ProductRecommendation> findBySourceProductCodeOrderByCoPurchaseCountDesc(String sourceProductCode);

    void deleteAllBySourceProductCode(String sourceProductCode);
}

