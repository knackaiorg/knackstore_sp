package com.knack.store.service;

import com.knack.store.dto.ProductReviewDTO;
import com.knack.store.model.Customer;
import com.knack.store.model.Product;
import com.knack.store.model.ProductReview;
import com.knack.store.repository.CustomerRepository;
import com.knack.store.repository.ProductRepository;
import com.knack.store.repository.ProductReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductReviewService {

    private final ProductReviewRepository productReviewRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    @Transactional
    public ProductReviewDTO.ProductReviewResponse submitReview(String email, Long productId,
                                                              ProductReviewDTO.SubmitReviewRequest request) {
        Customer customer = customerRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + productId));

        if (productReviewRepository.existsByProductIdAndCustomerId(productId, customer.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You've already reviewed this product.");
        }

        ProductReview review = ProductReview.builder()
                .product(product)
                .customer(customer)
                .rating(request.getRating())
                .comment(request.getComment())
            .approved(true)
                .build();

        ProductReview saved = productReviewRepository.save(review);
        refreshProductRatingStats(product);

        return toResponse(saved);
    }

    public List<ProductReviewDTO.ProductReviewResponse> getProductReviews(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + productId);
        }

        return productReviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ProductReviewDTO.ReviewEligibilityResponse getReviewEligibility(String email, Long productId) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        if (!productRepository.existsById(productId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + productId);
        }

        boolean alreadyReviewed = productReviewRepository.existsByProductIdAndCustomerId(productId, customer.getId());
        return ProductReviewDTO.ReviewEligibilityResponse.builder()
                .alreadyReviewed(alreadyReviewed)
                .build();
    }

    private void refreshProductRatingStats(Product product) {
        long totalReviews = productReviewRepository.countByProductIdAndApprovedTrue(product.getId());
        Double average = productReviewRepository.averageRatingByProductId(product.getId());

        product.setReviewCount((int) totalReviews);
        product.setAverageRating(average != null ? average : 0D);
        productRepository.save(product);
    }

    private ProductReviewDTO.ProductReviewResponse toResponse(ProductReview review) {
        return ProductReviewDTO.ProductReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .reviewerName(buildReviewerName(review.getCustomer()))
                .createdAt(review.getCreatedAt())
                .build();
    }

    private String buildReviewerName(Customer customer) {
        return "Customer";
    }
}
