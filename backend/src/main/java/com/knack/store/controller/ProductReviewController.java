package com.knack.store.controller;

import com.knack.store.dto.ProductReviewDTO;
import com.knack.store.service.ProductReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
@RequiredArgsConstructor
@Tag(name = "Product Reviews", description = "Submit and view reviews for products")
public class ProductReviewController {

    private final ProductReviewService productReviewService;

    @GetMapping
    @SecurityRequirements
    @Operation(summary = "Get product reviews", description = "Returns all reviews for the given product, newest first.")
    public ResponseEntity<List<ProductReviewDTO.ProductReviewResponse>> getReviews(@PathVariable Long productId) {
        return ResponseEntity.ok(productReviewService.getProductReviews(productId));
    }

    @PostMapping
    @Operation(summary = "Submit product review", description = "Submit a 1-5 star rating and optional comment for a product as the authenticated customer.")
    public ResponseEntity<ProductReviewDTO.ProductReviewResponse> submitReview(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long productId,
            @Valid @RequestBody ProductReviewDTO.SubmitReviewRequest request) {
        return ResponseEntity.ok(productReviewService.submitReview(user.getUsername(), productId, request));
    }
}
