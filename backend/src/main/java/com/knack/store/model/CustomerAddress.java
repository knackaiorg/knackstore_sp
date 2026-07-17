package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A single saved address in a customer's address book (Multi-Address Book
 * feature). Deliberately separate from {@link Order#getDeliveryAddress()}:
 * that field is a by-value {@link Address} snapshot copied at checkout time,
 * while this is the mutable, editable entry a customer manages from
 * "My Addresses". Editing or deleting a CustomerAddress must never affect an
 * Order that was already placed using its values at the time -- see
 * OrderService#placeOrder, which copies the submitted address fields into a
 * fresh embedded Address rather than storing a reference to this entity.
 */
@Entity
@Table(name = "customer_addresses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Embedded
    private Address address;

    // Named defaultAddress (not "isDefault") deliberately: Lombok/Jackson give
    // "is"-prefixed boolean fields special-cased getter/setter naming that
    // strips the prefix again, which quietly changes the serialized JSON
    // property name to "default" -- a reserved-word-adjacent surprise for
    // API consumers. Avoiding the "is" prefix on the field sidesteps that.
    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private boolean defaultAddress = false;

    @Builder.Default
    private LocalDateTime createdDate = LocalDateTime.now();

    private LocalDateTime lastModifiedDate;
}
