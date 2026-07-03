package com.knack.store.service;

import com.knack.store.dto.CartDTO;
import com.knack.store.dto.WishlistDTO;
import com.knack.store.model.*;
import com.knack.store.repository.CustomerRepository;
import com.knack.store.repository.ProductRepository;
import com.knack.store.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final CartService cartService;

    public WishlistDTO getWishlist(String email) {
        Wishlist wishlist = getOrCreateWishlist(email);
        return toDTO(wishlist);
    }

    @Transactional
    public WishlistDTO toggleEntry(String email, WishlistDTO.ToggleEntryRequest request) {
        if (request.getProductId() == null) {
            throw new RuntimeException("Product id is required");
        }

        Wishlist wishlist = getOrCreateWishlist(email);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        ProductVariant variant = null;
        if (request.getVariantId() != null) {
            variant = product.getVariants().stream()
                    .filter(v -> v.getId().equals(request.getVariantId()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Variant not found"));
        }

        ProductVariant finalVariant = variant;
        WishlistEntry existing = wishlist.getEntries().stream()
                .filter(e -> e.getProduct().getId().equals(product.getId()) &&
                        (finalVariant == null
                                ? e.getVariant() == null
                                : finalVariant.getId().equals(e.getVariant() != null ? e.getVariant().getId() : null)))
                .findFirst()
                .orElse(null);

        if (existing != null) {
            wishlist.getEntries().remove(existing);
        } else {
            WishlistEntry entry = WishlistEntry.builder()
                    .wishlist(wishlist)
                    .product(product)
                    .variant(variant)
                    .build();
            wishlist.getEntries().add(entry);
        }

        wishlistRepository.save(wishlist);
        return toDTO(wishlist);
    }

    @Transactional
    public WishlistDTO removeEntry(String email, Long entryId) {
        Wishlist wishlist = getOrCreateWishlist(email);
        wishlist.getEntries().removeIf(e -> e.getId().equals(entryId));
        wishlistRepository.save(wishlist);
        return toDTO(wishlist);
    }

    @Transactional
    public WishlistDTO moveEntryToCart(String email, Long entryId) {
        Wishlist wishlist = getOrCreateWishlist(email);
        WishlistEntry entry = wishlist.getEntries().stream()
                .filter(e -> e.getId().equals(entryId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Wishlist entry not found"));

        CartDTO.AddEntryRequest addEntryRequest = new CartDTO.AddEntryRequest();
        addEntryRequest.setProductId(entry.getProduct().getId());
        addEntryRequest.setVariantId(entry.getVariant() != null ? entry.getVariant().getId() : null);
        addEntryRequest.setQuantity(1);

        cartService.addEntry(email, addEntryRequest);

        wishlist.getEntries().remove(entry);
        wishlistRepository.save(wishlist);
        return toDTO(wishlist);
    }

    public Wishlist getOrCreateWishlist(String email) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        return wishlistRepository.findByCustomerId(customer.getId()).orElseGet(() -> {
            Wishlist wishlist = Wishlist.builder().customer(customer).build();
            return wishlistRepository.save(wishlist);
        });
    }

    public WishlistDTO toDTO(Wishlist wishlist) {
        return WishlistDTO.builder()
                .id(wishlist.getId())
                .totalItems(wishlist.getTotalItems())
                .entries(wishlist.getEntries().stream().map(e -> WishlistDTO.WishlistEntryDTO.builder()
                        .entryId(e.getId())
                        .addedAt(e.getAddedAt())
                        .productId(e.getProduct().getId())
                        .productCode(e.getProduct().getCode())
                        .productName(e.getProduct().getName())
                        .productImageUrl(e.getProduct().getImageUrl())
                        .price(e.getVariant() != null ? e.getVariant().getPrice() : e.getProduct().getBasePrice())
                        .variantId(e.getVariant() != null ? e.getVariant().getId() : null)
                        .variantSku(e.getVariant() != null ? e.getVariant().getSku() : null)
                        .variantDescription(buildVariantDescription(e.getVariant()))
                        .build()).collect(Collectors.toList()))
                .build();
    }

    private String buildVariantDescription(ProductVariant v) {
        if (v == null) return null;
        StringBuilder sb = new StringBuilder();
        if (v.getColor() != null) sb.append(v.getColor());
        if (v.getStorage() != null) {
            if (sb.length() > 0) sb.append(" / ");
            sb.append(v.getStorage());
        }
        return sb.toString();
    }
}
