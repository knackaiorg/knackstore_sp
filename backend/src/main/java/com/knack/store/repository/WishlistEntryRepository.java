package com.knack.store.repository;

import com.knack.store.model.WishlistEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WishlistEntryRepository extends JpaRepository<WishlistEntry, Long> {
    Optional<WishlistEntry> findByWishlistIdAndProductId(Long wishlistId, Long productId);
    void deleteByWishlistIdAndProductId(Long wishlistId, Long productId);
}

