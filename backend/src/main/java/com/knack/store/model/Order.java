package com.knack.store.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String orderCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    @Builder.Default
    private List<OrderEntry> entries = new ArrayList<>();

    @Embedded
    private Address deliveryAddress;

    private String status; // PLACED, PROCESSING, SHIPPED, DELIVERED, CANCELLED

    private Double totalPrice;

    private String paymentMethod;

    private String trackingNumber;

    private LocalDateTime placedDate;

    private LocalDateTime lastModifiedDate;
}
