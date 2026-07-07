package com.knack.store.service;

import com.knack.store.dto.CartDTO;
import com.knack.store.model.*;
import com.knack.store.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    public CartDTO getCart(String email) {
        Cart cart = getOrCreateCart(email);
        return toDTO(cart);
    }

    @Transactional
    public CartDTO addEntry(String email, CartDTO.AddEntryRequest request) {
        Cart cart = getOrCreateCart(email);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        ProductVariant variant = null;
        double unitPrice = product.getBasePrice();
        if (request.getVariantId() != null) {
            variant = product.getVariants().stream()
                    .filter(v -> v.getId().equals(request.getVariantId()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Variant not found"));
            unitPrice = variant.getPrice();
        }

        // Check if same product+variant already in cart — increment qty
        ProductVariant finalVariant = variant;
        CartEntry existing = cart.getEntries().stream()
                .filter(e -> e.getProduct().getId().equals(product.getId()) &&
                        (finalVariant == null ? e.getVariant() == null : finalVariant.getId().equals(e.getVariant() != null ? e.getVariant().getId() : null)))
                .findFirst().orElse(null);

        if (existing != null) {
            existing.setQuantity(existing.getQuantity() + request.getQuantity());
        } else {
            CartEntry entry = CartEntry.builder()
                    .cart(cart).product(product).variant(variant)
                    .quantity(request.getQuantity()).unitPrice(unitPrice).build();
            cart.getEntries().add(entry);
        }

        cartRepository.save(cart);
        return toDTO(cart);
    }

    @Transactional
    public CartDTO updateEntry(String email, Long entryId, int quantity) {
        Cart cart = getOrCreateCart(email);
        CartEntry entry = cart.getEntries().stream()
                .filter(e -> e.getId().equals(entryId))
                .findFirst().orElseThrow(() -> new RuntimeException("Cart entry not found"));

        if (quantity <= 0) {
            cart.getEntries().remove(entry);
        } else {
            entry.setQuantity(quantity);
        }
        cartRepository.save(cart);
        return toDTO(cart);
    }

    @Transactional
    public CartDTO removeEntry(String email, Long entryId) {
        Cart cart = getOrCreateCart(email);
        cart.getEntries().removeIf(e -> e.getId().equals(entryId));
        cartRepository.save(cart);
        return toDTO(cart);
    }

    @Transactional
    public void clearCart(Cart cart) {
        cart.getEntries().clear();
        cartRepository.save(cart);
    }

    public Cart getOrCreateCart(String email) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        return cartRepository.findByCustomerId(customer.getId()).orElseGet(() -> {
            Cart c = Cart.builder().customer(customer).build();
            return cartRepository.save(c);
        });
    }

    public CartDTO toDTO(Cart cart) {
        return CartDTO.builder()
                .id(cart.getId())
                .totalPrice(cart.getTotalPrice())
                .totalItems(cart.getTotalItems())
                .entries(cart.getEntries().stream().map(e -> CartDTO.CartEntryDTO.builder()
                        .entryId(e.getId())
                        .productId(e.getProduct().getId())
                        .productCode(e.getProduct().getCode())
                        .productName(e.getProduct().getName())
                        .productImageUrl(e.getProduct().getImageUrl())
                        .variantId(e.getVariant() != null ? e.getVariant().getId() : null)
                        .variantSku(e.getVariant() != null ? e.getVariant().getSku() : null)
                        .variantDescription(buildVariantDescription(e.getVariant()))
                        .quantity(e.getQuantity())
                        .unitPrice(e.getUnitPrice())
                        .lineTotal(e.getQuantity() * e.getUnitPrice())
                        .build()).collect(Collectors.toList()))
                .build();
    }

    private String buildVariantDescription(ProductVariant v) {
        if (v == null) return null;
        StringBuilder sb = new StringBuilder();
        if (v.getColor() != null) sb.append(v.getColor());
        if (v.getStorage() != null) { if (sb.length() > 0) sb.append(" / "); sb.append(v.getStorage()); }
        return sb.toString();
    }
}
