package com.knack.store.dto;

import com.knack.store.model.PromoCode;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PromoCodeDTO {
    private Long id;
    private String code;
    private PromoCode.DiscountType discountType;
    private Double discountValue;
    private Double minimumOrderAmount;

    @Data
    public static class ApplyRequest {
        private String code;
    }

    @Data
    @Builder
    public static class ApplyResponse {
        private boolean success;
        private String message;
        private String code;
        private Double discountAmount;
    }
}
