package com.knack.store.service;

import com.knack.store.dto.ProductDTO;
import com.knack.store.model.Order;
import com.knack.store.model.OrderEntry;
import com.knack.store.model.Product;
import com.knack.store.model.ProductRecommendation;
import com.knack.store.repository.OrderRepository;
import com.knack.store.repository.ProductRecommendationRepository;
import com.knack.store.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductRecommendationRepository recommendationRepository;
    private final ProductService productService;

    private static final int MAX_RECOMMENDATIONS = 3;

    /**
     * Get recommendations for a product. Returns up to 3 products:
     * 1. First tries precomputed co-purchase recommendations
     * 2. Falls back to same-category products if not enough
     */
    public List<ProductDTO> getRecommendations(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

        List<ProductDTO> results = new ArrayList<>();

        // 1. Get co-purchase recommendations from precomputed table
        List<ProductRecommendation> recs = recommendationRepository
                .findBySourceProductCodeOrderByCoPurchaseCountDesc(product.getCode());

        for (ProductRecommendation rec : recs) {
            if (results.size() >= MAX_RECOMMENDATIONS) break;
            Optional<Product> recProduct = productRepository.findByCode(rec.getRecommendedProductCode());
            recProduct.ifPresent(p -> results.add(productService.toDTO(p)));
        }

        // 2. Fallback: same-category products if not enough co-purchase recommendations
        if (results.size() < MAX_RECOMMENDATIONS && product.getCategory() != null) {
            Set<Long> excludeIds = results.stream().map(ProductDTO::getId).collect(Collectors.toSet());
            excludeIds.add(product.getId());

            List<Product> sameCategoryProducts = productRepository
                    .findByCategoryCode(product.getCategory().getCode());

            for (Product p : sameCategoryProducts) {
                if (results.size() >= MAX_RECOMMENDATIONS) break;
                if (!excludeIds.contains(p.getId())) {
                    results.add(productService.toDTO(p));
                    excludeIds.add(p.getId());
                }
            }
        }

        return results;
    }

    /**
     * Compute product recommendations based on order co-purchase history.
     * For each pair of products bought together in the same order,
     * increment a co-purchase counter.
     */
    @Transactional
    public void computeRecommendations() {
        log.info("Starting recommendation computation...");

        // Clear existing recommendations
        recommendationRepository.deleteAll();

        // Get all orders with entries eagerly loaded
        List<Order> orders = orderRepository.findAllWithEntries();

        // Count co-purchases: Map<productCode, Map<coProductCode, count>>
        Map<String, Map<String, Integer>> coPurchaseMap = new HashMap<>();

        for (Order order : orders) {
            List<OrderEntry> entries = order.getEntries();
            List<String> productCodes = entries.stream()
                    .map(OrderEntry::getProductCode)
                    .distinct()
                    .collect(Collectors.toList());

            // For each pair of products in the same order
            for (int i = 0; i < productCodes.size(); i++) {
                for (int j = 0; j < productCodes.size(); j++) {
                    if (i == j) continue;
                    String source = productCodes.get(i);
                    String recommended = productCodes.get(j);
                    coPurchaseMap
                            .computeIfAbsent(source, k -> new HashMap<>())
                            .merge(recommended, 1, Integer::sum);
                }
            }
        }

        // Save top recommendations for each product
        List<ProductRecommendation> allRecs = new ArrayList<>();
        for (Map.Entry<String, Map<String, Integer>> entry : coPurchaseMap.entrySet()) {
            String sourceCode = entry.getKey();
            List<Map.Entry<String, Integer>> sorted = entry.getValue().entrySet().stream()
                    .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                    .limit(MAX_RECOMMENDATIONS)
                    .collect(Collectors.toList());

            for (Map.Entry<String, Integer> rec : sorted) {
                allRecs.add(ProductRecommendation.builder()
                        .sourceProductCode(sourceCode)
                        .recommendedProductCode(rec.getKey())
                        .coPurchaseCount(rec.getValue())
                        .build());
            }
        }

        recommendationRepository.saveAll(allRecs);
        log.info("Recommendation computation complete. Saved {} pairings.", allRecs.size());
    }

    /**
     * Scheduled nightly recomputation at 2 AM.
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void scheduledCompute() {
        computeRecommendations();
    }
}




