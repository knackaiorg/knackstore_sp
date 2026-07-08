package com.knack.store.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderDTO {
    private Long id;
    private String orderCode;
    private String status;
    private Double totalPrice;
    private String paymentMethod;
    private String trackingNumber;
    private LocalDateTime placedDate;
    private AddressDTO deliveryAddress;
    private List<OrderEntryDTO> entries;

    @Data
    @Builder
    public static class OrderEntryDTO {
        private String productCode;
        private String productName;
        private String variantSku;
        private String variantDescription;
        private int quantity;
        private Double unitPrice;
        private Double totalPrice;
    }

    @Data
    public static class PlaceOrderRequest {
        private AddressDTO deliveryAddress;
        private String paymentMethod;
    }
}
