package com.knack.store.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FetchNotificationsResponse {

    private boolean success;
    private String message;
    private List<NotificationDetail> notifications;
    private int totalCount;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NotificationDetail {
        private Long id;
        private Long userId;
        private String sku;
        private String email;
        private String notificationStatus;
        private LocalDateTime subscribedAt;
        private LocalDateTime notifiedAt;
    }
}

