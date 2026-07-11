package com.knack.store.service;

import com.knack.store.dto.CustomerAddressDTO;
import com.knack.store.model.Address;
import com.knack.store.model.Customer;
import com.knack.store.model.CustomerAddress;
import com.knack.store.repository.CustomerAddressRepository;
import com.knack.store.repository.CustomerRepository;
import com.knack.store.util.AddressMapper;
import com.knack.store.util.AddressValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Multi-Address Book: lets a customer save, edit, delete, and pick a default
 * delivery address from a "My Addresses" section, instead of retyping an
 * address on every checkout.
 *
 * Two invariants this class exists to protect:
 *
 * 1. Exactly one address is ever flagged default for a customer whenever
 *    they have at least one saved address (never zero, never more than one).
 *    Every mutation path -- add, update, delete, explicit setDefault --
 *    routes through clearExistingDefault()/promotion logic below rather than
 *    trusting the caller to only ever flip one flag at a time.
 *
 * 2. This service never hands a CustomerAddress reference to OrderService.
 *    Checkout submits full address field values (see OrderDTO.PlaceOrderRequest),
 *    which OrderService copies into a fresh embedded Address on the Order.
 *    Editing or deleting a CustomerAddress here can never retroactively change
 *    what a past order says it shipped to -- that's the "snapshot" requirement
 *    flagged as non-negotiable during discovery.
 */
@Service
@RequiredArgsConstructor
public class CustomerAddressService {

    private final CustomerAddressRepository addressRepository;
    private final CustomerRepository customerRepository;

    @Transactional
    public List<CustomerAddressDTO> getAddresses(String email) {
        Customer customer = findCustomer(email);
        backfillFromLegacyDefaultAddressIfNeeded(customer);
        return addressRepository.findByCustomerIdOrderByDefaultAddressDescIdAsc(customer.getId()).stream()
                .map(AddressMapper::toCustomerAddressDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomerAddressDTO addAddress(String email, CustomerAddressDTO.SaveAddressRequest request) {
        AddressValidator.validate(request.getCountry(), request.getPostcode(), request.getPhone());
        Customer customer = findCustomer(email);

        boolean isFirstAddress = addressRepository.countByCustomerId(customer.getId()) == 0;
        boolean shouldBeDefault = isFirstAddress || request.isMakeDefault();
        if (shouldBeDefault) {
            clearExistingDefault(customer.getId());
        }

        CustomerAddress entity = CustomerAddress.builder()
                .customer(customer)
                .address(AddressMapper.toAddressFromSaveRequest(request))
                .defaultAddress(shouldBeDefault)
                .createdDate(LocalDateTime.now())
                .build();

        return AddressMapper.toCustomerAddressDTO(addressRepository.save(entity));
    }

    @Transactional
    public CustomerAddressDTO updateAddress(String email, Long addressId, CustomerAddressDTO.SaveAddressRequest request) {
        AddressValidator.validate(request.getCountry(), request.getPostcode(), request.getPhone());
        CustomerAddress existing = findOwned(email, addressId);

        existing.setAddress(AddressMapper.toAddressFromSaveRequest(request));
        existing.setLastModifiedDate(LocalDateTime.now());

        if (request.isMakeDefault() && !existing.isDefaultAddress()) {
            clearExistingDefault(existing.getCustomer().getId());
            existing.setDefaultAddress(true);
        }

        return AddressMapper.toCustomerAddressDTO(addressRepository.save(existing));
    }

    @Transactional
    public void deleteAddress(String email, Long addressId) {
        CustomerAddress existing = findOwned(email, addressId);
        Long customerId = existing.getCustomer().getId();
        boolean wasDefault = existing.isDefaultAddress();

        addressRepository.delete(existing);

        if (wasDefault) {
            // Promote whichever address remains (oldest first) so checkout
            // always has a sensible default to pre-fill from, as long as at
            // least one saved address is left.
            addressRepository.findByCustomerIdOrderByDefaultAddressDescIdAsc(customerId).stream()
                    .findFirst()
                    .ifPresent(next -> {
                        next.setDefaultAddress(true);
                        addressRepository.save(next);
                    });
        }
    }

    @Transactional
    public CustomerAddressDTO setDefault(String email, Long addressId) {
        CustomerAddress target = findOwned(email, addressId);
        clearExistingDefault(target.getCustomer().getId());
        target.setDefaultAddress(true);
        return AddressMapper.toCustomerAddressDTO(addressRepository.save(target));
    }

    private void clearExistingDefault(Long customerId) {
        addressRepository.findByCustomerIdAndDefaultAddressTrue(customerId).ifPresent(current -> {
            current.setDefaultAddress(false);
            addressRepository.save(current);
        });
    }

    private CustomerAddress findOwned(String email, Long addressId) {
        Customer customer = findCustomer(email);
        return addressRepository.findByIdAndCustomerId(addressId, customer.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));
    }

    private Customer findCustomer(String email) {
        return customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
    }

    /**
     * Discovery-session requirement: "What happens to a customer who already
     * has a single address on file today, once this ships?" -- "That existing
     * address becomes the first entry in their new address book, marked as
     * default. No action needed on their end."
     *
     * Implemented as a lazy, idempotent backfill on first read rather than a
     * one-time startup migration script: it runs per-customer the first time
     * their address book is actually opened, which works the same way whether
     * this app restarts with a fresh in-memory database (hackathon demo) or
     * runs against a real persistent one (production) -- no separate migration
     * job to remember to run. Once a customer has at least one CustomerAddress
     * row, this is a no-op forever after.
     */
    private void backfillFromLegacyDefaultAddressIfNeeded(Customer customer) {
        if (addressRepository.countByCustomerId(customer.getId()) > 0) return;
        Address legacy = customer.getDefaultAddress();
        if (legacy == null || legacy.getLine1() == null || legacy.getLine1().isBlank()) return;

        // Deliberately a fresh copy, not the same Address instance held by
        // customer.getDefaultAddress() -- keeps the two independent in memory,
        // consistent with how every other Address copy in this codebase is
        // made (see AddressMapper), rather than aliasing one mutable object
        // across two different owning entities.
        Address copy = Address.builder()
                .firstName(legacy.getFirstName()).lastName(legacy.getLastName())
                .line1(legacy.getLine1()).line2(legacy.getLine2())
                .city(legacy.getCity()).state(legacy.getState())
                .postcode(legacy.getPostcode()).country(legacy.getCountry())
                .phone(legacy.getPhone()).build();

        CustomerAddress migrated = CustomerAddress.builder()
                .customer(customer)
                .address(copy)
                .defaultAddress(true)
                .createdDate(LocalDateTime.now())
                .build();
        addressRepository.save(migrated);
    }
}
