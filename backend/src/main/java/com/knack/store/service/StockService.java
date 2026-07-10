package com.knack.store.service;

import com.knack.store.exception.InsufficientStockException;
import com.knack.store.model.CartEntry;
import com.knack.store.model.Product;
import com.knack.store.model.ProductVariant;
import com.knack.store.repository.CartEntryRepository;
import com.knack.store.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StockService {

    public static final int RESERVATION_HOLD_MINUTES = 15;

    private final ProductRepository productRepository;
    private final CartEntryRepository cartEntryRepository;

    /**
     * Locks the product row so concurrent reservation/commit attempts for it are serialized
     * (first request to acquire the lock is processed first).
     */
    @Transactional
    public Product lockProduct(Long productId) {
        return productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public int availableQuantity(Long productId, Long variantId, int totalStock) {
        int reserved = cartEntryRepository.sumActiveReservedQuantity(productId, variantId, LocalDateTime.now());
        return Math.max(0, totalStock - reserved);
    }

    /** Throws if requestedQuantity can't be held, given what every other cart already has reserved. */
    public void ensureAvailable(Product product, ProductVariant variant, Long cartId, int requestedQuantity) {
        int totalStock = variant != null ? variant.getStock() : product.getStockQuantity();
        int reservedByOthers = cartEntryRepository.sumActiveReservedQuantityExcludingCart(
                product.getId(), variant != null ? variant.getId() : null, LocalDateTime.now(), cartId);
        int available = totalStock - reservedByOthers;

        if (requestedQuantity > available) {
            if (available <= 0) {
                throw new InsufficientStockException("This item just sold out.");
            }
            throw new InsufficientStockException("Only " + available + " left in stock.");
        }
    }

    /**
     * Converts a cart entry's hold into a permanent stock deduction at checkout.
     * If the hold had already expired, re-validates availability first (FR-13).
     */
    public void commitReservation(Product product, ProductVariant variant, Long cartId, int quantity, boolean holdStillActive) {
        if (!holdStillActive) {
            ensureAvailable(product, variant, cartId, quantity);
        }

        if (variant != null) {
            variant.setStock(variant.getStock() - quantity);
        } else {
            product.setStockQuantity(product.getStockQuantity() - quantity);
        }
        productRepository.save(product);
    }

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void releaseExpiredReservations() {
        List<CartEntry> expired = cartEntryRepository.findExpiredReservations(LocalDateTime.now());
        expired.forEach(e -> e.setReservedUntil(null));
        cartEntryRepository.saveAll(expired);
    }
}
