package com.knack.store.service;

import com.knack.store.dto.CustomerCarouselDTO;
import com.knack.store.model.CustomerCarousel;
import com.knack.store.repository.CustomerCarouselRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Transactional
public class CustomerCarouselService {

    private  CustomerCarouselRepository customerCarouselRepository;

    public CustomerCarouselDTO.CarouselResponse trackProduct(CustomerCarouselDTO.TrackRequest request) {
        if (request.getCustomerId() == null || request.getCustomerId().isBlank()) {
            throw new RuntimeException("customerId is required");
        }
        if (request.getProductId() == null || request.getProductId().isBlank()) {
            throw new RuntimeException("productId is required");
        }

        CustomerCarousel carousel = customerCarouselRepository.findByCustomerId(request.getCustomerId())
                .orElseGet(() -> CustomerCarousel.builder()
                        .customerId(request.getCustomerId())
                        .productIds(new ArrayList<>())
                        .updatedAt(LocalDateTime.now())
                        .build());

        if (!carousel.getProductIds().contains(request.getProductId())) {
            carousel.getProductIds().add(request.getProductId());
        }

        carousel.setUpdatedAt(LocalDateTime.now());
        CustomerCarousel saved = customerCarouselRepository.save(carousel);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public CustomerCarouselDTO.CarouselResponse getByCustomerId(String customerId) {
        CustomerCarousel carousel = customerCarouselRepository.findByCustomerId(customerId)
                .orElseGet(() -> CustomerCarousel.builder()
                        .customerId(customerId)
                        .productIds(new ArrayList<>())
                        .updatedAt(LocalDateTime.now())
                        .build());
        return toResponse(carousel);
    }

    private CustomerCarouselDTO.CarouselResponse toResponse(CustomerCarousel carousel) {
        return new CustomerCarouselDTO.CarouselResponse(
                carousel.getCustomerId(),
                carousel.getProductIds(),
                carousel.getUpdatedAt()
        );
    }
}
