package com.knack.store.service;

import com.knack.store.dto.CartDTO;
import com.knack.store.dto.SavedCartDTO;
import com.knack.store.model.*;
import com.knack.store.repository.CustomerRepository;
import com.knack.store.repository.ProductRepository;
import com.knack.store.repository.SavedCartEntryRepository;
import com.knack.store.repository.SavedCartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavedCartService {

    private final SavedCartRepository savedCartRepository;
    private final SavedCartEntryRepository savedCartEntryRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final CartService cartService;

    @Transactional
    public SavedCartDTO.SavedCartDetail saveCurrentCart(String email, SavedCartDTO.SaveCartRequest request) {
        Cart activeCart = cartService.getOrCreateCart(email);
        if (activeCart.getEntries().isEmpty()) {
            throw new RuntimeException("Your active cart is empty");
        }
        if (request == null || request.getCartName() == null || request.getCartName().trim().isEmpty()) {
            throw new RuntimeException("Cart name is required");
        }

        String cartName = request.getCartName().trim();
        if (cartName.length() > 60) {
            throw new RuntimeException("Cart name must be 60 characters or less");
        }

        Customer customer = getCustomer(email);

        SavedCart savedCart;
        if (request.getTargetSavedCartId() != null) {
            savedCart = getOwnedSavedCart(email, request.getTargetSavedCartId());
        } else {
            savedCart = savedCartRepository
                    .findFirstByCustomerIdAndCartNameIgnoreCaseOrderBySavedAtDesc(customer.getId(), cartName)
                    .orElseGet(() -> SavedCart.builder()
                            .customer(customer)
                            .cartNumber(generateCartNumber())
                            .cartName(cartName)
                            .savedAt(LocalDateTime.now())
                            .build());
        }

        savedCart.setCartName(cartName);
        savedCart.setSavedAt(LocalDateTime.now());

        if (savedCart.getId() != null) {
            savedCartEntryRepository.deleteBySavedCartId(savedCart.getId());
            savedCart.getEntries().clear();
        }

        List<SavedCartEntry> snapshotEntries = activeCart.getEntries().stream()
                .map(entry -> SavedCartEntry.builder()
                        .savedCart(savedCart)
                        .productId(entry.getProduct().getId())
                        .productCode(entry.getProduct().getCode())
                        .productName(entry.getProduct().getName())
                        .productImageUrl(entry.getProduct().getImageUrl())
                        .variantId(entry.getVariant() != null ? entry.getVariant().getId() : null)
                        .variantSku(entry.getVariant() != null ? entry.getVariant().getSku() : null)
                        .variantDescription(buildVariantDescription(entry.getVariant()))
                        .quantity(entry.getQuantity())
                        .unitPrice(entry.getUnitPrice())
                        .build())
                .collect(Collectors.toList());

        savedCart.getEntries().addAll(snapshotEntries);
        savedCart.setSkuCount(snapshotEntries.size());
        savedCart.setTotalPrice(snapshotEntries.stream().mapToDouble(SavedCartEntry::getLineTotal).sum());

        SavedCart saved = savedCartRepository.save(savedCart);
        return toDetailDTO(saved);
    }

    public List<SavedCartDTO.SavedCartSummary> getSavedCarts(String email) {
        Customer customer = getCustomer(email);
        return savedCartRepository.findByCustomerIdOrderBySavedAtDesc(customer.getId())
                .stream()
                .map(this::toSummaryDTO)
                .collect(Collectors.toList());
    }

    public SavedCartDTO.SavedCartDetail getSavedCartDetail(String email, Long savedCartId) {
        SavedCart savedCart = getOwnedSavedCart(email, savedCartId);
        return toDetailDTO(savedCart);
    }

    @Transactional
    public void deleteSavedCart(String email, Long savedCartId) {
        SavedCart savedCart = getOwnedSavedCart(email, savedCartId);
        savedCartRepository.delete(savedCart);
    }

    @Transactional
    public SavedCartDTO.SavedCartDetail removeEntry(String email, Long savedCartId, Long entryId) {
        SavedCart savedCart = getOwnedSavedCart(email, savedCartId);
        boolean removed = savedCart.getEntries().removeIf(entry -> entry.getId().equals(entryId));
        if (!removed) {
            throw new RuntimeException("Saved cart entry not found");
        }

        savedCart.setSkuCount(savedCart.getEntries().size());
        savedCart.setTotalPrice(savedCart.getEntries().stream().mapToDouble(SavedCartEntry::getLineTotal).sum());

        SavedCart saved = savedCartRepository.save(savedCart);
        return toDetailDTO(saved);
    }

    @Transactional
    public SavedCartDTO.AddSavedCartToCartResponse addAllToActiveCart(String email, Long savedCartId) {
        SavedCart savedCart = getOwnedSavedCart(email, savedCartId);

        int itemsAdded = 0;
        int itemsUnavailable = 0;
        List<String> unavailableItems = new ArrayList<>();

        for (SavedCartEntry savedEntry : savedCart.getEntries()) {
            try {
                Product product = productRepository.findById(savedEntry.getProductId()).orElse(null);
                if (product == null) {
                    itemsUnavailable++;
                    unavailableItems.add(savedEntry.getProductName() + " (no longer available)");
                    continue;
                }

                Long variantId = savedEntry.getVariantId();
                if (variantId != null) {
                    boolean variantExists = product.getVariants().stream().anyMatch(v -> v.getId().equals(variantId));
                    if (!variantExists) {
                        itemsUnavailable++;
                        unavailableItems.add(savedEntry.getProductName() + " (selected variant unavailable)");
                        continue;
                    }
                }

                CartDTO.AddEntryRequest request = new CartDTO.AddEntryRequest();
                request.setProductId(product.getId());
                request.setVariantId(savedEntry.getVariantId());
                request.setQuantity(savedEntry.getQuantity());
                cartService.addEntry(email, request);
                itemsAdded++;
            } catch (Exception ex) {
                itemsUnavailable++;
                unavailableItems.add(savedEntry.getProductName() + " (" + ex.getMessage() + ")");
            }
        }

        CartDTO updatedCart = cartService.getCart(email);
        String message;
        if (itemsUnavailable == 0) {
            message = "All saved cart items were added to your cart.";
        } else if (itemsAdded == 0) {
            message = "No items could be added to your cart. Please review unavailable items.";
        } else {
            message = String.format("%d item(s) added. %d item(s) were unavailable.", itemsAdded, itemsUnavailable);
        }

        return SavedCartDTO.AddSavedCartToCartResponse.builder()
                .success(itemsAdded > 0)
                .message(message)
                .itemsAdded(itemsAdded)
                .itemsUnavailable(itemsUnavailable)
                .unavailableItems(unavailableItems)
                .updatedCart(updatedCart)
                .build();
    }

    private Customer getCustomer(String email) {
        return customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
    }

    private SavedCart getOwnedSavedCart(String email, Long savedCartId) {
        Customer customer = getCustomer(email);
        return savedCartRepository.findByIdAndCustomerId(savedCartId, customer.getId())
                .orElseThrow(() -> new RuntimeException("Saved cart not found"));
    }

    private SavedCartDTO.SavedCartSummary toSummaryDTO(SavedCart savedCart) {
        return SavedCartDTO.SavedCartSummary.builder()
                .id(savedCart.getId())
                .cartNumber(savedCart.getCartNumber())
                .cartName(savedCart.getCartName())
                .skuCount(savedCart.getSkuCount())
                .totalPrice(savedCart.getTotalPrice())
                .savedAt(savedCart.getSavedAt())
                .build();
    }

    private SavedCartDTO.SavedCartDetail toDetailDTO(SavedCart savedCart) {
        return SavedCartDTO.SavedCartDetail.builder()
                .id(savedCart.getId())
                .cartNumber(savedCart.getCartNumber())
                .cartName(savedCart.getCartName())
                .skuCount(savedCart.getSkuCount())
                .totalPrice(savedCart.getTotalPrice())
                .savedAt(savedCart.getSavedAt())
                .entries(savedCart.getEntries().stream().map(entry -> SavedCartDTO.SavedCartEntryDetail.builder()
                        .entryId(entry.getId())
                        .productId(entry.getProductId())
                        .productCode(entry.getProductCode())
                        .productName(entry.getProductName())
                        .productImageUrl(entry.getProductImageUrl())
                        .variantId(entry.getVariantId())
                        .variantSku(entry.getVariantSku())
                        .variantDescription(entry.getVariantDescription())
                        .quantity(entry.getQuantity())
                        .unitPrice(entry.getUnitPrice())
                        .lineTotal(entry.getLineTotal())
                        .build()).collect(Collectors.toList()))
                .build();
    }

    private String generateCartNumber() {
        return "SC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String buildVariantDescription(ProductVariant variant) {
        if (variant == null) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        if (variant.getColor() != null) {
            sb.append(variant.getColor());
        }
        if (variant.getStorage() != null) {
            if (sb.length() > 0) {
                sb.append(" / ");
            }
            sb.append(variant.getStorage());
        }
        return sb.toString();
    }
}
