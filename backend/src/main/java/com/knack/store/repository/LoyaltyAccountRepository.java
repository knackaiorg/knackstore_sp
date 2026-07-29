package com.knack.store.repository;

import com.knack.store.model.LoyaltyAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoyaltyAccountRepository extends JpaRepository<LoyaltyAccount, Long> {
    Optional<LoyaltyAccount> findByCustomerId(Long customerId);
    Optional<LoyaltyAccount> findByCustomerEmail(String email);
}
