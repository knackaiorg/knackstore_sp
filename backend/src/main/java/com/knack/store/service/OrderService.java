package com.knack.store.service;

import com.knack.store.dto.AddressDTO;
import com.knack.store.dto.OrderDTO;
import com.knack.store.model.*;
import com.knack.store.repository.CustomerRepository;
import com.knack.store.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final CartService cartService;

    @Transactional
    public OrderDTO placeOrder(String email, OrderDTO.PlaceOrderRequest request) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Cart cart = cartService.getOrCreateCart(email);
        if (cart.getEntries().isEmpty()) throw new RuntimeException("Cart is empty");

        Address delivery = toAddress(request.getDeliveryAddress());

        List<OrderEntry> entries = cart.getEntries().stream().map(e -> OrderEntry.builder()
                .productCode(e.getProduct().getCode())
                .productName(e.getProduct().getName())
                .variantSku(e.getVariant() != null ? e.getVariant().getSku() : null)
                .variantDescription(buildVariantDesc(e.getVariant()))
                .quantity(e.getQuantity())
                .unitPrice(e.getUnitPrice())
                .totalPrice(e.getQuantity() * e.getUnitPrice())
                .build()).collect(Collectors.toList());

        Order order = Order.builder()
                .orderCode("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .customer(customer)
                .entries(entries)
                .deliveryAddress(delivery)
                .status("PLACED")
                .totalPrice(cart.getTotalPrice())
                .paymentMethod(request.getPaymentMethod())
                .trackingNumber("TRK-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase())
                .placedDate(LocalDateTime.now())
                .lastModifiedDate(LocalDateTime.now())
                .build();

        entries.forEach(e -> e.setOrder(order));
        Order saved = orderRepository.save(order);
        cartService.clearCart(cart);
        return toDTO(saved);
    }

    public List<OrderDTO> getOrderHistory(String email) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        return orderRepository.findByCustomerIdOrderByPlacedDateDesc(customer.getId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public OrderDTO getOrderByCode(String email, String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (!order.getCustomer().getEmail().equals(email)) throw new RuntimeException("Access denied");
        return toDTO(order);
    }

    public OrderDTO toDTO(Order o) {
        return OrderDTO.builder()
                .id(o.getId())
                .orderCode(o.getOrderCode())
                .status(o.getStatus())
                .totalPrice(o.getTotalPrice())
                .paymentMethod(o.getPaymentMethod())
                .trackingNumber(o.getTrackingNumber())
                .placedDate(o.getPlacedDate())
                .deliveryAddress(o.getDeliveryAddress() != null ? toAddressDTO(o.getDeliveryAddress()) : null)
                .entries(o.getEntries().stream().map(e -> OrderDTO.OrderEntryDTO.builder()
                        .productCode(e.getProductCode())
                        .productName(e.getProductName())
                        .variantSku(e.getVariantSku())
                        .variantDescription(e.getVariantDescription())
                        .quantity(e.getQuantity())
                        .unitPrice(e.getUnitPrice())
                        .totalPrice(e.getTotalPrice())
                        .build()).collect(Collectors.toList()))
                .build();
    }

    private Address toAddress(AddressDTO dto) {
        if (dto == null) return null;
        return Address.builder()
                .firstName(dto.getFirstName()).lastName(dto.getLastName())
                .line1(dto.getLine1()).line2(dto.getLine2())
                .city(dto.getCity()).state(dto.getState())
                .postcode(dto.getPostcode()).country(dto.getCountry())
                .phone(dto.getPhone()).build();
    }

    private AddressDTO toAddressDTO(Address a) {
        AddressDTO dto = new AddressDTO();
        dto.setFirstName(a.getFirstName()); dto.setLastName(a.getLastName());
        dto.setLine1(a.getLine1()); dto.setLine2(a.getLine2());
        dto.setCity(a.getCity()); dto.setState(a.getState());
        dto.setPostcode(a.getPostcode()); dto.setCountry(a.getCountry());
        dto.setPhone(a.getPhone());
        return dto;
    }

    private String buildVariantDesc(ProductVariant v) {
        if (v == null) return null;
        StringBuilder sb = new StringBuilder();
        if (v.getColor() != null) sb.append(v.getColor());
        if (v.getStorage() != null) { if (sb.length() > 0) sb.append(" / "); sb.append(v.getStorage()); }
        return sb.toString();
    }
}
