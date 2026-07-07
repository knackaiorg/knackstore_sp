package com.knack.store.repository;

import com.knack.store.model.ProductView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductViewRepository extends JpaRepository<ProductView, Long> {

    /**
     * Find all product views for a guest session, ordered by most recent first
     */
    List<ProductView> findByGuestSessionIdOrderByViewedAtDesc(String guestSessionId);

    /**
     * Find all product views for a guest session with pagination, ordered by most recent first
     */
    List<ProductView> findByGuestSessionIdOrderByViewedAtDesc(String guestSessionId, Pageable pageable);

    /**
     * Find a specific product view for a guest session and product
     */
    Optional<ProductView> findByGuestSessionIdAndProductId(String guestSessionId, Long productId);

    /**
     * Delete all views for a guest session
     */
    void deleteByGuestSessionId(String guestSessionId);

    /**
     * Count total views for a guest session
     */
    long countByGuestSessionId(String guestSessionId);
}

