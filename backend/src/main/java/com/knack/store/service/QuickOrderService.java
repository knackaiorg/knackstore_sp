package com.knack.store.service;

import com.knack.store.dto.AddAllToCartResponse;
import com.knack.store.dto.QuickOrderCsvUploadResponse;
import com.knack.store.dto.QuickOrderSearchResponse;
import com.knack.store.model.*;
import com.knack.store.repository.CartRepository;
import com.knack.store.repository.CustomerRepository;
import com.knack.store.repository.ProductRepository;
import com.knack.store.repository.QuickOrderEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QuickOrderService {

    private final ProductRepository productRepository;
    private final QuickOrderEntryRepository quickOrderEntryRepository;
    private final CartRepository cartRepository;
    private final CustomerRepository customerRepository;
    private final StockService stockService;

    @Transactional
    public QuickOrderCsvUploadResponse processCsvUpload(MultipartFile file) {
        String sessionId = UUID.randomUUID().toString();
        List<QuickOrderCsvUploadResponse.StagingItem> stagingItems = new ArrayList<>();
        List<QuickOrderCsvUploadResponse.ErrorItem> errors = new ArrayList<>();
        List<QuickOrderEntry> entriesToSave = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            int rowNumber = 0;

            while ((line = reader.readLine()) != null) {
                rowNumber++;
                line = line.trim();

                // Skip empty lines and header row
                if (line.isEmpty()) continue;
                if (rowNumber == 1 && (line.toLowerCase().contains("sku") || line.toLowerCase().contains("product"))) {
                    continue;
                }

                String[] parts = line.split(",", -1);
                if (parts.length < 2) {
                    errors.add(QuickOrderCsvUploadResponse.ErrorItem.builder()
                            .rowNumber(rowNumber)
                            .skuCode(line)
                            .productName(null)
                            .quantity(0)
                            .reason("INVALID_FORMAT")
                            .message("SKU " + line + " cannot be added because the row format is invalid. Expected: SKU,Quantity")
                            .build());
                    continue;
                }

                String sku = parts[0].trim().replaceAll("^\"|\"$", "");
                String qtyStr = parts[1].trim().replaceAll("^\"|\"$", "");

                int quantity;
                try {
                    quantity = Integer.parseInt(qtyStr);
                    if (quantity <= 0) {
                        errors.add(QuickOrderCsvUploadResponse.ErrorItem.builder()
                                .rowNumber(rowNumber).skuCode(sku).productName(null).quantity(quantity)
                                .reason("INVALID_QUANTITY")
                                .message("SKU " + sku + " cannot be added because the quantity must be greater than 0.")
                                .build());
                        continue;
                    }
                } catch (NumberFormatException e) {
                    errors.add(QuickOrderCsvUploadResponse.ErrorItem.builder()
                            .rowNumber(rowNumber).skuCode(sku).productName(null).quantity(0)
                            .reason("INVALID_QUANTITY")
                            .message("SKU " + sku + " cannot be added because the quantity '" + qtyStr + "' is not a valid number.")
                            .build());
                    continue;
                }

                Optional<Product> productOpt = productRepository.findByCode(sku);
                if (productOpt.isEmpty()) {
                    errors.add(QuickOrderCsvUploadResponse.ErrorItem.builder()
                            .rowNumber(rowNumber).skuCode(sku).productName(null).quantity(quantity)
                            .reason("NOT_FOUND")
                            .message("SKU " + sku + " cannot be added because it was not found.")
                            .build());
                    continue;
                }

                Product product = productOpt.get();
                if (product.getStockQuantity() <= 0) {
                    errors.add(QuickOrderCsvUploadResponse.ErrorItem.builder()
                            .rowNumber(rowNumber).skuCode(sku).productName(product.getName()).quantity(quantity)
                            .reason("OUT_OF_STOCK")
                            .message("SKU " + sku + " (" + product.getName() + ") cannot be added because it is out of stock.")
                            .build());
                    continue;
                }

                QuickOrderEntry entry = QuickOrderEntry.builder()
                        .sessionId(sessionId)
                        .skuCode(sku)
                        .productName(product.getName())
                        .price(product.getBasePrice())
                        .quantity(quantity)
                        .availableStock(product.getStockQuantity())
                        .valid(true)
                        .build();
                entriesToSave.add(entry);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse CSV file: " + e.getMessage(), e);
        }

        List<QuickOrderEntry> saved = quickOrderEntryRepository.saveAll(entriesToSave);

        for (QuickOrderEntry entry : saved) {
            stagingItems.add(QuickOrderCsvUploadResponse.StagingItem.builder()
                    .entryId(entry.getId())
                    .skuCode(entry.getSkuCode())
                    .productName(entry.getProductName())
                    .price(entry.getPrice())
                    .quantity(entry.getQuantity())
                    .availableStock(entry.getAvailableStock())
                    .build());
        }

        return QuickOrderCsvUploadResponse.builder()
                .sessionId(sessionId)
                .totalRows(stagingItems.size() + errors.size())
                .validCount(stagingItems.size())
                .errorCount(errors.size())
                .stagingItems(stagingItems)
                .errors(errors)
                .build();
    }

    public QuickOrderCsvUploadResponse getStagingList(String sessionId) {
        List<QuickOrderEntry> entries = quickOrderEntryRepository.findBySessionId(sessionId);

        List<QuickOrderCsvUploadResponse.StagingItem> items = entries.stream()
                .map(e -> QuickOrderCsvUploadResponse.StagingItem.builder()
                        .entryId(e.getId())
                        .skuCode(e.getSkuCode())
                        .productName(e.getProductName())
                        .price(e.getPrice())
                        .quantity(e.getQuantity())
                        .availableStock(e.getAvailableStock())
                        .build())
                .toList();

        return QuickOrderCsvUploadResponse.builder()
                .sessionId(sessionId)
                .totalRows(items.size())
                .validCount(items.size())
                .errorCount(0)
                .stagingItems(items)
                .errors(List.of())
                .build();
    }

    @Transactional
    public AddAllToCartResponse addAllToCart(String sessionId, String customerEmail) {
        List<QuickOrderEntry> stagingEntries = quickOrderEntryRepository.findBySessionId(sessionId);
        if (stagingEntries.isEmpty()) {
            throw new RuntimeException("No staging entries found for session: " + sessionId);
        }

        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        Cart cart = cartRepository.findByCustomerId(customer.getId())
                .orElseGet(() -> {
                    Cart c = Cart.builder().customer(customer).build();
                    return cartRepository.save(c);
                });

        List<AddAllToCartResponse.AddedItem> addedItems = new ArrayList<>();
        List<AddAllToCartResponse.FailedItem> failedItems = new ArrayList<>();
        List<QuickOrderEntry> toRemoveFromStaging = new ArrayList<>();

        for (QuickOrderEntry stagingEntry : stagingEntries) {
            Optional<Product> productOpt = productRepository.findByCode(stagingEntry.getSkuCode());

            if (productOpt.isEmpty()) {
                failedItems.add(AddAllToCartResponse.FailedItem.builder()
                        .entryId(stagingEntry.getId())
                        .skuCode(stagingEntry.getSkuCode())
                        .productName(stagingEntry.getProductName())
                        .quantity(stagingEntry.getQuantity())
                        .reason("NOT_FOUND")
                        .message("SKU " + stagingEntry.getSkuCode() + " cannot be added because it was not found.")
                        .build());
                continue;
            }

            Product product = productOpt.get();

            // Re-verify stock availability
            if (product.getStockQuantity() <= 0) {
                stagingEntry.setValid(false);
                stagingEntry.setErrorMessage("Out of stock");
                failedItems.add(AddAllToCartResponse.FailedItem.builder()
                        .entryId(stagingEntry.getId())
                        .skuCode(stagingEntry.getSkuCode())
                        .productName(product.getName())
                        .quantity(stagingEntry.getQuantity())
                        .reason("OUT_OF_STOCK")
                        .message("SKU " + stagingEntry.getSkuCode() + " (" + product.getName() + ") cannot be added because it is out of stock.")
                        .build());
                continue;
            }

            // Check if same product already exists in cart — merge quantities
            CartEntry existingCartEntry = cart.getEntries().stream()
                    .filter(e -> e.getProduct().getId().equals(product.getId()) && e.getVariant() == null)
                    .findFirst().orElse(null);

            boolean merged = false;
            LocalDateTime holdUntil = LocalDateTime.now().plusMinutes(StockService.RESERVATION_HOLD_MINUTES);

            if (existingCartEntry != null) {
                int newQty = existingCartEntry.getQuantity() + stagingEntry.getQuantity();
                existingCartEntry.setQuantity(newQty);
                existingCartEntry.setReservedUntil(holdUntil);
                existingCartEntry.setValidForCheckout(true);
                merged = true;
            } else {
                CartEntry newEntry = CartEntry.builder()
                        .cart(cart)
                        .product(product)
                        .variant(null)
                        .quantity(stagingEntry.getQuantity())
                        .unitPrice(product.getBasePrice())
                        .reservedUntil(holdUntil)
                        .build();
                cart.getEntries().add(newEntry);
            }

            addedItems.add(AddAllToCartResponse.AddedItem.builder()
                    .entryId(stagingEntry.getId())
                    .skuCode(stagingEntry.getSkuCode())
                    .productName(product.getName())
                    .quantity(stagingEntry.getQuantity())
                    .unitPrice(product.getBasePrice())
                    .mergedWithExisting(merged)
                    .build());

            toRemoveFromStaging.add(stagingEntry);
        }

        // Save the updated cart
        if (!addedItems.isEmpty()) {
            // Clear promo code when cart is modified
            if (cart.getAppliedPromoCode() != null) {
                cart.setAppliedPromoCode(null);
                cart.setDiscountAmount(0.0);
            }
            cartRepository.save(cart);
        }

        // Remove successfully added entries from staging; keep failed ones
        quickOrderEntryRepository.deleteAll(toRemoveFromStaging);

        // Update failed entries in staging
        stagingEntries.stream()
                .filter(e -> !e.isValid())
                .forEach(quickOrderEntryRepository::save);

        return AddAllToCartResponse.builder()
                .totalItems(stagingEntries.size())
                .addedCount(addedItems.size())
                .failedCount(failedItems.size())
                .addedItems(addedItems)
                .failedItems(failedItems)
                .build();
    }

    public QuickOrderSearchResponse searchProducts(String query) {
        if (query == null || query.trim().length() < 2) {
            return QuickOrderSearchResponse.builder().results(List.of()).build();
        }

        List<Product> products = productRepository.findTop10ByNameOrCodeContainingIgnoreCase(query.trim());

        List<QuickOrderSearchResponse.ProductResult> results = products.stream()
                .map(p -> QuickOrderSearchResponse.ProductResult.builder()
                        .productId(p.getId())
                        .skuCode(p.getCode())
                        .productName(p.getName())
                        .brand(p.getBrand())
                        .imageUrl(p.getImageUrl())
                        .price(p.getBasePrice())
                        .availableStock(p.getStockQuantity())
                        .inStock(p.getStockQuantity() > 0)
                        .build())
                .toList();

        return QuickOrderSearchResponse.builder().results(results).build();
    }
}