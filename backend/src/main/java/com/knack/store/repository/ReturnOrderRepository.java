package com.knack.store.repository;

import com.knack.store.model.ReturnOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for ReturnOrder entity
 */
@Repository
public interface ReturnOrderRepository extends JpaRepository<ReturnOrder, Long> {

    /**
     * Find return order by return code
     */
    Optional<ReturnOrder> findByReturnCode(String returnCode);

    /**
     * Find all return orders for a customer
     */
    List<ReturnOrder> findByCustomerId(Long customerId);

    /**
     * Find return orders for a specific order
     */
    List<ReturnOrder> findByOrderId(Long orderId);

    /**
     * Find return orders by status
     */
    List<ReturnOrder> findByStatus(String status);

    /**
     * Find return orders by customer and status
     */
    List<ReturnOrder> findByCustomerIdAndStatus(Long customerId, String status);

    /**
     * Find return orders by order and status
     */
    List<ReturnOrder> findByOrderIdAndStatus(Long orderId, String status);
}

