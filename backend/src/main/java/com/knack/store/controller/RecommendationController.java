package com.knack.store.controller;

import com.knack.store.dto.ProductDTO;
import com.knack.store.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Recommendations", description = "Product recommendations based on co-purchase history")
@SecurityRequirements
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/products/{id}/recommendations")
    @Operation(summary = "Get product recommendations",
            description = "Returns up to 3 recommended products based on co-purchase history, with same-category fallback.")
    public ResponseEntity<List<ProductDTO>> getRecommendations(@PathVariable Long id) {
        return ResponseEntity.ok(recommendationService.getRecommendations(id));
    }

    @PostMapping("/recommendations/compute")
    @Operation(summary = "Trigger recommendation computation",
            description = "On-demand trigger to recompute product recommendations from order history.")
    public ResponseEntity<Map<String, String>> computeRecommendations() {
        recommendationService.computeRecommendations();
        return ResponseEntity.ok(Map.of("message", "Recommendations computed successfully"));
    }
}

