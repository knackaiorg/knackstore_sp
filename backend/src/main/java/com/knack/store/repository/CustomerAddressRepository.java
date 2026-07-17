package com.knack.store.repository;

import com.knack.store.model.CustomerAddress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerAddressRepository extends JpaRepository<CustomerAddress, Long> {

    List<CustomerAddress> findByCustomerIdOrderByDefaultAddressDescIdAsc(Long customerId);

    Optional<CustomerAddress> findByIdAndCustomerId(Long id, Long customerId);

    Optional<CustomerAddress> findByCustomerIdAndDefaultAddressTrue(Long customerId);

    long countByCustomerId(Long customerId);
}
