package com.knack.store.service;

import com.knack.store.dto.QuickOrderCsvUploadResponse;
import com.knack.store.model.Product;
import com.knack.store.model.QuickOrderEntry;
import com.knack.store.repository.ProductRepository;
import com.knack.store.repository.QuickOrderEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QuickOrderService {

    private final ProductRepository productRepository;
    private final QuickOrderEntryRepository quickOrderEntryRepository;

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
}
