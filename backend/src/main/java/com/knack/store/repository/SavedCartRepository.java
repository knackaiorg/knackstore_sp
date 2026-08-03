package com.knack.store.repository;

import com.knack.store.model.SavedCart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedCartRepository extends JpaRepository<SavedCart, Long> {
    List<SavedCart> findByCustomerIdOrderBySavedAtDesc(Long customerId);
    Optional<SavedCart> findByIdAndCustomerId(Long id, Long customerId);
    Optional<SavedCart> findFirstByCustomerIdAndCartNameIgnoreCaseOrderBySavedAtDesc(Long customerId, String cartName);
}
