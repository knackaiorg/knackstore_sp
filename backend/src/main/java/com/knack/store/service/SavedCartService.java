package com.knack.store.service;

import com.knack.store.dto.SavedCartDTO;
import com.knack.store.model.Cart;
import com.knack.store.model.CartEntry;
import com.knack.store.model.Customer;
import com.knack.store.model.Product;
import com.knack.store.model.ProductVariant;
import com.knack.store.model.SavedCart;
import com.knack.store.model.SavedCartEntry;
import com.knack.store.repository.CartRepository;
import com.knack.store.repository.CustomerRepository;
import com.knack.store.repository.SavedCartEntryRepository;
import com.knack.store.repository.SavedCartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavedCartService {

    private final SavedCartRepository savedCartRepository;
    private final SavedCartEntryRepository savedCartEntryRepository;
    private final CartRepository cartRepository;
    private final CustomerRepository customerRepository;
    private final StockService stockService;

    @Transactional
    public SavedCartDTO saveCurrentCart(String email) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        Cart cart = cartRepository.findByCustomerId(customer.getId())
                .orElseThrow(() -> new RuntimeException("Cart not found"));

        SavedCart savedCart = SavedCart.builder()
                .customer(customer)
                .cartNumber("SC-" + System.currentTimeMillis())
                .createdAt(LocalDateTime.now())
                .build();

        for (CartEntry entry : cart.getEntries()) {
            Product product = entry.getProduct();
            ProductVariant variant = entry.getVariant();
            SavedCartEntry savedEntry = SavedCartEntry.builder()
                    .savedCart(savedCart)
                    .product(product)
                    .variant(variant)
                    .quantity(entry.getQuantity())
                    .unitPrice(entry.getUnitPrice())
                    .build();
            savedCart.getEntries().add(savedEntry);
        }

        SavedCart persisted = savedCartRepository.save(savedCart);
        persisted.setCartNumber("SC-" + persisted.getId());
        persisted = savedCartRepository.save(persisted);
        if (!persisted.getEntries().isEmpty()) {
            savedCartEntryRepository.saveAll(persisted.getEntries());
        }
        return toDTO(persisted);
    }

    @Transactional(readOnly = true)
    public List<SavedCartDTO> listSavedCarts(String email) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        return savedCartRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SavedCartDTO getSavedCart(String email, Long savedCartId) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        SavedCart savedCart = savedCartRepository.findByIdAndCustomerId(savedCartId, customer.getId())
                .orElseThrow(() -> new RuntimeException("Saved cart not found"));
        return toDTO(savedCart);
    }

    @Transactional
    public void deleteSavedCart(String email, Long savedCartId) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        SavedCart savedCart = savedCartRepository.findByIdAndCustomerId(savedCartId, customer.getId())
                .orElseThrow(() -> new RuntimeException("Saved cart not found"));
        savedCartRepository.delete(savedCart);
    }

    @Transactional
    public SavedCartDTO removeSavedCartEntry(String email, Long savedCartId, Long entryId) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        SavedCart savedCart = savedCartRepository.findByIdAndCustomerId(savedCartId, customer.getId())
                .orElseThrow(() -> new RuntimeException("Saved cart not found"));
        savedCart.getEntries().removeIf(entry -> entry.getId().equals(entryId));
        SavedCart persisted = savedCartRepository.save(savedCart);
        return toDTO(persisted);
    }

    @Transactional
    public SavedCartDTO addSavedCartToActiveCart(String email, Long savedCartId) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        SavedCart savedCart = savedCartRepository.findByIdAndCustomerId(savedCartId, customer.getId())
                .orElseThrow(() -> new RuntimeException("Saved cart not found"));
        Cart activeCart = cartRepository.findByCustomerId(customer.getId())
                .orElseThrow(() -> new RuntimeException("Cart not found"));

        boolean skippedAny = false;
        for (SavedCartEntry entry : savedCart.getEntries()) {
            try {
                Product product = entry.getProduct();
                ProductVariant variant = entry.getVariant();
                CartEntry existing = activeCart.getEntries().stream()
                        .filter(e -> e.getProduct().getId().equals(product.getId()) &&
                                (variant == null ? e.getVariant() == null : variant.getId().equals(e.getVariant() != null ? e.getVariant().getId() : null)))
                        .findFirst().orElse(null);

                int newQty = (existing != null ? existing.getQuantity() : 0) + entry.getQuantity();
                Product locked = stockService.lockProduct(product.getId());
                stockService.ensureAvailable(locked, variant, activeCart.getId(), newQty);
                if (existing != null) {
                    existing.setQuantity(newQty);
                } else {
                    CartEntry cartEntry = CartEntry.builder()
                            .cart(activeCart)
                            .product(product)
                            .variant(variant)
                            .quantity(entry.getQuantity())
                            .unitPrice(entry.getUnitPrice())
                            .build();
                    activeCart.getEntries().add(cartEntry);
                }
            } catch (RuntimeException ex) {
                skippedAny = true;
            }
        }

        cartRepository.save(activeCart);
        SavedCartDTO result = toDTO(savedCart);
        result.setMessage(skippedAny
                ? "Added available items to your cart. Some items were skipped because they are no longer available."
                : "Added all items from this saved cart to your active cart.");
        return result;
    }

    private SavedCartDTO toDTO(SavedCart savedCart) {
        return SavedCartDTO.builder()
                .id(savedCart.getId())
                .cartNumber(savedCart.getCartNumber())
                .skuCount(savedCart.getSkuCount())
                .totalPrice(savedCart.getTotalPrice())
                .createdAt(savedCart.getCreatedAt())
                .entries(savedCart.getEntries().stream().map(this::toEntryDTO).collect(Collectors.toList()))
                .build();
    }

    private SavedCartDTO.SavedCartEntryDTO toEntryDTO(SavedCartEntry entry) {
        return SavedCartDTO.SavedCartEntryDTO.builder()
                .entryId(entry.getId())
                .productId(entry.getProduct().getId())
                .productCode(entry.getProduct().getCode())
                .productName(entry.getProduct().getName())
                .productImageUrl(entry.getProduct().getImageUrl())
                .variantId(entry.getVariant() != null ? entry.getVariant().getId() : null)
                .variantSku(entry.getVariant() != null ? entry.getVariant().getSku() : null)
                .variantDescription(buildVariantDescription(entry.getVariant()))
                .quantity(entry.getQuantity())
                .unitPrice(entry.getUnitPrice())
                .lineTotal(entry.getQuantity() * entry.getUnitPrice())
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
