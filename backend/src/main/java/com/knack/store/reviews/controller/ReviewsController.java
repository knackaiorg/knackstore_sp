package com.knack.store.reviews.controller;

import com.knack.store.reviews.dto.SubmitReviewRequest;
import com.knack.store.reviews.dto.ReviewEligibilityDTO;
import com.knack.store.reviews.dto.ReviewListWsDTO;
import com.knack.store.reviews.dto.ReviewWsDTO;
import com.knack.store.reviews.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
@RequiredArgsConstructor
@Tag(name = "Product Reviews", description = "Submit and view reviews for products")
public class ReviewsController {

    private final ReviewService reviewService;

    @GetMapping
    @SecurityRequirements
    @Operation(summary = "Get product reviews", description = "Returns all reviews for the given product with aggregate stats, newest first.")
    public ResponseEntity<ReviewListWsDTO> getReviews(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getProductReviews(productId));
    }

    @GetMapping("/me")
    @Operation(summary = "Get review eligibility for current user", description = "Returns whether the authenticated customer has already reviewed this product.")
    public ResponseEntity<ReviewEligibilityDTO> getReviewEligibility(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long productId) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return ResponseEntity.ok(reviewService.getReviewEligibility(user.getUsername(), productId));
    }

    @PostMapping
    @Operation(summary = "Submit product review", description = "Submit a 1-5 star rating and optional comment for a product as the authenticated customer.")
    public ResponseEntity<ReviewWsDTO> submitReview(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long productId,
            @Valid @RequestBody SubmitReviewRequest request) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        ReviewWsDTO result = reviewService.submitReview(
                user.getUsername(),
                productId,
                request.getRating(),
                request.getComment()
        );
        return ResponseEntity.status(201).body(result);
    }
}
