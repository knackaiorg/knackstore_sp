package com.knack.store.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockNotificationResponse {

    private boolean success;
    private String message;
    private Long notificationId;
    private boolean alreadySubscribed;
    private boolean exists;
}

