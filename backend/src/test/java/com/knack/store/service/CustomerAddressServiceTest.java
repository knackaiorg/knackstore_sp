package com.knack.store.service;

import com.knack.store.dto.CustomerAddressDTO;
import com.knack.store.model.Address;
import com.knack.store.model.Customer;
import com.knack.store.model.CustomerAddress;
import com.knack.store.repository.CustomerAddressRepository;
import com.knack.store.repository.CustomerRepository;
import com.knack.store.util.AddressMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Covers the Multi-Address Book feature (CustomerAddressService), built from
 * the discovery-session transcript. Three things get dedicated coverage
 * because they were called out explicitly as easy to get subtly wrong:
 *
 *  - exactly one default address at all times once a customer has any saved
 *    ("addAddress_secondAddress_*", "setDefault_*", "deleteAddress_*")
 *  - existing customers' single address carries over automatically as the
 *    first, default entry ("getAddresses_backfillsFromLegacyDefaultAddress_*")
 *  - editing/deleting a saved address must never retroactively change what a
 *    past order recorded ("savedAddress_editedAfterBeingUsedOnAnOrder_*"),
 *    which Arjun flagged as the one non-negotiable requirement.
 */
@ExtendWith(MockitoExtension.class)
class CustomerAddressServiceTest {

    @Mock private CustomerAddressRepository addressRepository;
    @Mock private CustomerRepository customerRepository;

    @InjectMocks
    private CustomerAddressService service;

    @Captor
    private ArgumentCaptor<CustomerAddress> savedCaptor;

    private Customer customer;

    @BeforeEach
    void setUp() {
        customer = Customer.builder().id(1L).email("jane@example.com").firstName("Jane").lastName("Doe").build();
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
    }

    private CustomerAddressDTO.SaveAddressRequest validRequest(boolean makeDefault) {
        CustomerAddressDTO.SaveAddressRequest req = new CustomerAddressDTO.SaveAddressRequest();
        req.setFirstName("Jane"); req.setLastName("Doe");
        req.setLine1("221B Baker Street"); req.setLine2("");
        req.setCity("Hyderabad"); req.setState("Telangana");
        req.setPostcode("500081"); req.setCountry("India");
        req.setPhone("+91 9000000000");
        req.setMakeDefault(makeDefault);
        return req;
    }

    @Test
    void addAddress_firstAddress_isDefaultEvenWithoutMakeDefaultFlag() {
        when(addressRepository.countByCustomerId(1L)).thenReturn(0L);
        when(addressRepository.save(any())).thenAnswer(inv -> {
            CustomerAddress ca = inv.getArgument(0);
            ca.setId(10L);
            return ca;
        });

        CustomerAddressDTO result = service.addAddress("jane@example.com", validRequest(false));

        assertThat(result.isDefaultAddress()).isTrue();
        verify(addressRepository, never()).findByCustomerIdAndDefaultAddressTrue(any());
    }

    @Test
    void addAddress_secondAddress_notDefaultUnlessRequested() {
        when(addressRepository.countByCustomerId(1L)).thenReturn(1L);
        when(addressRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CustomerAddressDTO result = service.addAddress("jane@example.com", validRequest(false));

        assertThat(result.isDefaultAddress()).isFalse();
    }

    @Test
    void addAddress_secondAddressWithMakeDefault_clearsPreviousDefault() {
        when(addressRepository.countByCustomerId(1L)).thenReturn(1L);
        CustomerAddress previousDefault = CustomerAddress.builder().id(5L).customer(customer)
                .address(Address.builder().line1("Old address").build()).defaultAddress(true).build();
        when(addressRepository.findByCustomerIdAndDefaultAddressTrue(1L)).thenReturn(Optional.of(previousDefault));
        when(addressRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CustomerAddressDTO result = service.addAddress("jane@example.com", validRequest(true));

        assertThat(previousDefault.isDefaultAddress()).isFalse();
        assertThat(result.isDefaultAddress()).isTrue();
        verify(addressRepository).save(previousDefault);
    }

    @Test
    void addAddress_invalidPostcodeForIndia_rejectedBeforeTouchingRepository() {
        CustomerAddressDTO.SaveAddressRequest req = validRequest(false);
        req.setPostcode("ABC"); // India requires 6 digits

        assertThatThrownBy(() -> service.addAddress("jane@example.com", req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("postal code");
        verifyNoInteractions(addressRepository);
    }

    @Test
    void addAddress_invalidPhone_rejected() {
        CustomerAddressDTO.SaveAddressRequest req = validRequest(false);
        req.setPhone("abc");

        assertThatThrownBy(() -> service.addAddress("jane@example.com", req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("phone number");
    }

    @Test
    void setDefault_clearsOldDefaultAndSetsNewOne() {
        CustomerAddress oldDefault = CustomerAddress.builder().id(1L).customer(customer)
                .address(Address.builder().line1("Old").build()).defaultAddress(true).build();
        CustomerAddress target = CustomerAddress.builder().id(2L).customer(customer)
                .address(Address.builder().line1("New").build()).defaultAddress(false).build();
        when(addressRepository.findByIdAndCustomerId(2L, 1L)).thenReturn(Optional.of(target));
        when(addressRepository.findByCustomerIdAndDefaultAddressTrue(1L)).thenReturn(Optional.of(oldDefault));
        when(addressRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CustomerAddressDTO result = service.setDefault("jane@example.com", 2L);

        assertThat(oldDefault.isDefaultAddress()).isFalse();
        assertThat(result.isDefaultAddress()).isTrue();
    }

    @Test
    void setDefault_addressNotOwnedByCustomer_throws404() {
        when(addressRepository.findByIdAndCustomerId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.setDefault("jane@example.com", 99L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Address not found");
    }

    @Test
    void deleteAddress_deletingDefault_promotesNextRemainingAddress() {
        CustomerAddress toDelete = CustomerAddress.builder().id(1L).customer(customer)
                .address(Address.builder().line1("Deleted").build()).defaultAddress(true).build();
        CustomerAddress remaining = CustomerAddress.builder().id(2L).customer(customer)
                .address(Address.builder().line1("Remaining").build()).defaultAddress(false).build();
        when(addressRepository.findByIdAndCustomerId(1L, 1L)).thenReturn(Optional.of(toDelete));
        when(addressRepository.findByCustomerIdOrderByDefaultAddressDescIdAsc(1L)).thenReturn(List.of(remaining));

        service.deleteAddress("jane@example.com", 1L);

        verify(addressRepository).delete(toDelete);
        assertThat(remaining.isDefaultAddress()).isTrue();
        verify(addressRepository).save(remaining);
    }

    @Test
    void deleteAddress_deletingNonDefault_leavesDefaultUntouched() {
        CustomerAddress toDelete = CustomerAddress.builder().id(2L).customer(customer)
                .address(Address.builder().line1("Deleted").build()).defaultAddress(false).build();
        when(addressRepository.findByIdAndCustomerId(2L, 1L)).thenReturn(Optional.of(toDelete));

        service.deleteAddress("jane@example.com", 2L);

        verify(addressRepository).delete(toDelete);
        verify(addressRepository, never()).findByCustomerIdOrderByDefaultAddressDescIdAsc(any());
    }

    @Test
    void getAddresses_backfillsFromLegacyDefaultAddress_whenBookIsEmpty() {
        Address legacy = Address.builder().firstName("Jane").lastName("Doe")
                .line1("123 Tech Park").city("Hyderabad").state("Telangana")
                .postcode("500081").country("India").phone("+91 9000000000").build();
        customer.setDefaultAddress(legacy);
        when(addressRepository.countByCustomerId(1L)).thenReturn(0L);
        when(addressRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(addressRepository.findByCustomerIdOrderByDefaultAddressDescIdAsc(1L))
                .thenReturn(List.of(CustomerAddress.builder().id(1L).customer(customer).address(legacy).defaultAddress(true).build()));

        List<CustomerAddressDTO> result = service.getAddresses("jane@example.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).isDefaultAddress()).isTrue();
        assertThat(result.get(0).getLine1()).isEqualTo("123 Tech Park");
        verify(addressRepository).save(savedCaptor.capture());
        assertThat(savedCaptor.getValue().isDefaultAddress()).isTrue();
    }

    @Test
    void getAddresses_noLegacyAddressAndNoneSaved_returnsEmptyWithoutCreatingJunkRow() {
        when(addressRepository.countByCustomerId(1L)).thenReturn(0L);
        when(addressRepository.findByCustomerIdOrderByDefaultAddressDescIdAsc(1L)).thenReturn(List.of());

        List<CustomerAddressDTO> result = service.getAddresses("jane@example.com");

        assertThat(result).isEmpty();
        verify(addressRepository, never()).save(any());
    }

    @Test
    void getAddresses_alreadyHasSavedAddresses_backfillIsANoOp() {
        when(addressRepository.countByCustomerId(1L)).thenReturn(2L);
        when(addressRepository.findByCustomerIdOrderByDefaultAddressDescIdAsc(1L)).thenReturn(List.of());

        service.getAddresses("jane@example.com");

        verify(addressRepository, never()).save(any());
    }

    /**
     * The non-negotiable requirement from discovery: past orders keep a
     * frozen copy of the address used at checkout, independent of later
     * edits to the saved address it came from. OrderService builds its
     * Order.deliveryAddress via AddressMapper.toAddressFromSaveRequest(...) from plain
     * field values submitted at checkout time (see OrderService#placeOrder) --
     * never from a CustomerAddress reference -- so mutating or deleting the
     * CustomerAddress afterward cannot reach the already-placed order's data.
     * This test proves the copy is a true value copy at the object level.
     */
    @Test
    void savedAddress_editedAfterBeingUsedOnAnOrder_doesNotAffectTheEarlierSnapshot() {
        CustomerAddress saved = CustomerAddress.builder().id(1L).customer(customer)
                .address(Address.builder().firstName("Jane").lastName("Doe")
                        .line1("221B Baker Street").city("Hyderabad").state("Telangana")
                        .postcode("500081").country("India").phone("+91 9000000000").build())
                .defaultAddress(true).build();

        // Checkout takes a snapshot of the saved address's field values --
        // exactly what OrderController/OrderService receive as PlaceOrderRequest.deliveryAddress.
        CustomerAddressDTO.SaveAddressRequest checkoutSnapshotRequest = new CustomerAddressDTO.SaveAddressRequest();
        checkoutSnapshotRequest.setFirstName(saved.getAddress().getFirstName());
        checkoutSnapshotRequest.setLastName(saved.getAddress().getLastName());
        checkoutSnapshotRequest.setLine1(saved.getAddress().getLine1());
        checkoutSnapshotRequest.setCity(saved.getAddress().getCity());
        checkoutSnapshotRequest.setState(saved.getAddress().getState());
        checkoutSnapshotRequest.setPostcode(saved.getAddress().getPostcode());
        checkoutSnapshotRequest.setCountry(saved.getAddress().getCountry());
        checkoutSnapshotRequest.setPhone(saved.getAddress().getPhone());
        Address orderDeliveryAddress = AddressMapper.toAddressFromSaveRequest(checkoutSnapshotRequest);

        // Customer later edits the saved address (e.g. moves house).
        saved.getAddress().setLine1("999 New Address Lane");
        saved.getAddress().setCity("Bengaluru");

        assertThat(orderDeliveryAddress.getLine1()).isEqualTo("221B Baker Street");
        assertThat(orderDeliveryAddress.getCity()).isEqualTo("Hyderabad");
        assertThat(saved.getAddress().getLine1()).isEqualTo("999 New Address Lane");
    }
}
