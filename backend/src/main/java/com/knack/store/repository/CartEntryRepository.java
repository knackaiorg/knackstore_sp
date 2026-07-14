package com.knack.store.repository;

import com.knack.store.model.CartEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CartEntryRepository extends JpaRepository<CartEntry, Long> {

    // Sum of quantity currently held (active, non-expired reservation) across every cart for a product/variant.
    @Query("SELECT COALESCE(SUM(ce.quantity), 0) FROM CartEntry ce " +
           "WHERE ce.product.id = :productId " +
           "AND ((:variantId IS NULL AND ce.variant IS NULL) OR (ce.variant.id = :variantId)) " +
           "AND ce.reservedUntil IS NOT NULL AND ce.reservedUntil > :now")
    int sumActiveReservedQuantity(@Param("productId") Long productId,
                                   @Param("variantId") Long variantId,
                                   @Param("now") LocalDateTime now);

    // Same as above but excluding one cart's own holds, used when that cart is re-requesting a new quantity.
    @Query("SELECT COALESCE(SUM(ce.quantity), 0) FROM CartEntry ce " +
           "WHERE ce.product.id = :productId " +
           "AND ((:variantId IS NULL AND ce.variant IS NULL) OR (ce.variant.id = :variantId)) " +
           "AND ce.reservedUntil IS NOT NULL AND ce.reservedUntil > :now " +
           "AND ce.cart.id <> :excludeCartId")
    int sumActiveReservedQuantityExcludingCart(@Param("productId") Long productId,
                                                @Param("variantId") Long variantId,
                                                @Param("now") LocalDateTime now,
                                                @Param("excludeCartId") Long excludeCartId);

    @Query("SELECT ce FROM CartEntry ce WHERE ce.reservedUntil IS NOT NULL AND ce.reservedUntil < :now")
    List<CartEntry> findExpiredReservations(@Param("now") LocalDateTime now);
}
