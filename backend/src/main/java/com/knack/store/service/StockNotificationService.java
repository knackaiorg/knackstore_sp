package com.knack.store.service;

import com.knack.store.dto.StockNotificationRequest;
import com.knack.store.dto.StockNotificationResponse;
import com.knack.store.dto.FetchNotificationsResponse;
import com.knack.store.dto.FetchNotificationsResponse.NotificationDetail;
import com.knack.store.model.Customer;
import com.knack.store.model.StockNotification;
import com.knack.store.repository.CustomerRepository;
import com.knack.store.repository.StockNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockNotificationService {

    private final StockNotificationRepository stockNotificationRepository;
    private final CustomerRepository customerRepository;

    @Transactional
    public StockNotificationResponse subscribe(StockNotificationRequest request) {
        try {
            // Find customer by email
            Customer customer = customerRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("Customer not found with email: " + request.getEmail()));

            // Check if notification already exists for this user and SKU
            var existingNotification = stockNotificationRepository.findByUserIdAndSku(customer.getId(), request.getSku());

            if (request.isSubscribeNow()) {
                // If subscribeNow is true, create entry if it doesn't exist, or return existing
                return existingNotification
                        .map(existing -> StockNotificationResponse.builder()
                                .success(true)
                                .message("Already subscribed to notifications for this SKU")
                                .notificationId(existing.getId())
                                .alreadySubscribed(true)
                                .exists(true)
                                .build())
                        .orElseGet(() -> {
                            // Create new notification
                            StockNotification created = stockNotificationRepository.save(StockNotification.builder()
                                    .userId(customer.getId())
                                    .sku(request.getSku())
                                    .email(request.getEmail())
                                    .notificationStatus("PENDING")
                                    .build());

                            return StockNotificationResponse.builder()
                                    .success(true)
                                    .message("Successfully subscribed to stock notifications")
                                    .notificationId(created.getId())
                                    .alreadySubscribed(false)
                                    .exists(true)
                                    .build();
                        });
            } else {
                // If subscribeNow is false, just check if entry exists
                return existingNotification
                        .map(existing -> StockNotificationResponse.builder()
                                .success(true)
                                .message("Notification entry exists for this user and SKU")
                                .notificationId(existing.getId())
                                .exists(true)
                                .build())
                        .orElseGet(() -> StockNotificationResponse.builder()
                                .success(true)
                                .message("No notification entry found for this user and SKU")
                                .exists(false)
                                .build());
            }
        } catch (Exception e) {
            return StockNotificationResponse.builder()
                    .success(false)
                    .message("Failed to process request: " + e.getMessage())
                    .exists(false)
                    .build();
        }
    }

    @Transactional(readOnly = true)
    public FetchNotificationsResponse fetchAllNotifications(String email) {
        try {
            // Try to find notifications directly by email (no customer verification needed for fetching)
            List<StockNotification> notifications = stockNotificationRepository.findAllByEmail(email);

            if (notifications.isEmpty()) {
                return FetchNotificationsResponse.builder()
                        .success(true)
                        .message("No notifications found for this email: " + email)
                        .notifications(List.of())
                        .totalCount(0)
                        .build();
            }

            // Convert to DTO
            List<NotificationDetail> details = notifications.stream()
                    .map(sn -> NotificationDetail.builder()
                            .id(sn.getId())
                            .userId(sn.getUserId())
                            .sku(sn.getSku())
                            .email(sn.getEmail())
                            .notificationStatus(sn.getNotificationStatus())
                            .subscribedAt(sn.getSubscribedAt())
                            .notifiedAt(sn.getNotifiedAt())
                            .build())
                    .collect(Collectors.toList());

            return FetchNotificationsResponse.builder()
                    .success(true)
                    .message("Successfully fetched " + details.size() + " notification(s)")
                    .notifications(details)
                    .totalCount(details.size())
                    .build();
        } catch (Exception e) {
            return FetchNotificationsResponse.builder()
                    .success(false)
                    .message("Failed to fetch notifications: " + e.getMessage())
                    .notifications(List.of())
                    .totalCount(0)
                    .build();
        }
    }

    // New method to delete a notification by id and email
    @Transactional
    public StockNotificationResponse deleteNotification(Long id, String email) {
        try {
            int deleted = stockNotificationRepository.deleteByIdAndEmail(id, email);
            if (deleted > 0) {
                return StockNotificationResponse.builder()
                        .success(true)
                        .message("Notification deleted successfully")
                        .notificationId(id)
                        .build();
            } else {
                return StockNotificationResponse.builder()
                        .success(false)
                        .message("No notification found for given id and email")
                        .notificationId(id)
                        .build();
            }
        } catch (Exception e) {
            return StockNotificationResponse.builder()
                    .success(false)
                    .message("Failed to delete notification: " + e.getMessage())
                    .notificationId(id)
                    .build();
        }
    }
}
