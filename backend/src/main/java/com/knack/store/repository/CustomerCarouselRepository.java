package com.knack.store.repository;

import com.knack.store.model.CustomerCarousel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerCarouselRepository extends JpaRepository<CustomerCarousel, Long> {
    Optional<CustomerCarousel> findByCustomerId(String customerId);

    long deleteByCustomerId(String customerId);
}

