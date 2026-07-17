package com.knack.store.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryOptionDTO {
    private String option;
    private String deliveryTime;
    private Double cost;
    private Boolean isDefault;
}
