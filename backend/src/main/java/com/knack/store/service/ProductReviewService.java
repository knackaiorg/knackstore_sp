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
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

        ProductReview review = ProductReview.builder()
                .product(product)
                .customer(customer)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        ProductReview saved = productReviewRepository.save(review);
        refreshProductRatingStats(product);

        return toResponse(saved);
    }

    public List<ProductReviewDTO.ProductReviewResponse> getProductReviews(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new RuntimeException("Product not found: " + productId);
        }

        return productReviewRepository.findByProductIdOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private void refreshProductRatingStats(Product product) {
        long totalReviews = productReviewRepository.countByProductId(product.getId());
        Double average = productReviewRepository.averageRatingByProductId(product.getId());

        product.setReviewCount((int) totalReviews);
        product.setAverageRating((int) Math.round(average != null ? average : 0D));
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
        String fullName = ((customer.getFirstName() != null ? customer.getFirstName().trim() : "")
                + " "
                + (customer.getLastName() != null ? customer.getLastName().trim() : "")).trim();

        if (!fullName.isEmpty()) {
            return fullName;
        }
        return customer.getEmail();
    }
}
