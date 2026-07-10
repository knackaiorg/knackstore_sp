package com.knack.store.repository;

import com.knack.store.model.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByCustomerId(Long customerId);
    Optional<Address> findByIdAndCustomerId(Long addressId, Long customerId);
}

