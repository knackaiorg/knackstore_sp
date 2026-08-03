package com.knack.store.repository;

import com.knack.store.model.LoyaltyTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoyaltyTransactionRepository extends JpaRepository<LoyaltyTransaction, Long> {
    List<LoyaltyTransaction> findByAccountIdOrderByCreatedDateDesc(Long accountId);
}
