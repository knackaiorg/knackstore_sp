package com.knack.store.reviews.service;

import com.knack.store.model.Customer;
import com.knack.store.model.Product;
import com.knack.store.model.ProductReview;
import com.knack.store.repository.CustomerRepository;
import com.knack.store.repository.ProductRepository;
import com.knack.store.reviews.dao.ReviewDao;
import com.knack.store.reviews.dto.ReviewEligibilityDTO;
import com.knack.store.reviews.dto.ReviewListWsDTO;
import com.knack.store.reviews.dto.ReviewWsDTO;
import com.knack.store.reviews.populator.ReviewPopulator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewDao reviewDao;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final ReviewPopulator reviewPopulator;

    @Transactional
    public ReviewWsDTO submitReview(String email, Long productId, Integer rating, String comment) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + productId));

        if (reviewDao.hasUserReviewedProduct(productId, customer.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You've already reviewed this product.");
        }

        ProductReview review = ProductReview.builder()
                .product(product)
                .customer(customer)
                .rating(rating)
                .comment(comment)
                .approved(true)
                .build();

        ProductReview saved = reviewDao.save(review);
        refreshProductRatingStats(product);

        return reviewPopulator.populate(saved);
    }

    public ReviewListWsDTO getProductReviews(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + productId);
        }

        List<ReviewWsDTO> reviews = reviewDao.findApprovedByProductIdNewestFirst(productId)
                .stream()
                .map(reviewPopulator::populate)
                .collect(Collectors.toList());

        long totalCount = reviewDao.countApprovedByProductId(productId);
        Double average = reviewDao.getAverageRatingByProductId(productId);

        return ReviewListWsDTO.builder()
                .reviews(reviews)
                .totalCount(totalCount)
                .averageRating(average != null ? average : 0.0)
                .build();
    }

    public ReviewEligibilityDTO getReviewEligibility(String email, Long productId) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        if (!productRepository.existsById(productId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + productId);
        }

        boolean alreadyReviewed = reviewDao.hasUserReviewedProduct(productId, customer.getId());
        return ReviewEligibilityDTO.builder()
                .alreadyReviewed(alreadyReviewed)
                .build();
    }

    private void refreshProductRatingStats(Product product) {
        long totalReviews = reviewDao.countApprovedByProductId(product.getId());
        Double average = reviewDao.getAverageRatingByProductId(product.getId());

        product.setReviewCount((int) totalReviews);
        product.setAverageRating(average != null ? average : 0.0);
        productRepository.save(product);
    }
}
