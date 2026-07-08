package com.knack.store.controller;

import com.knack.store.dto.StockNotificationRequest;
import com.knack.store.dto.StockNotificationResponse;
import com.knack.store.dto.FetchNotificationsResponse;
import com.knack.store.service.StockNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Stock Notification", description = "Subscribe to stock alerts for out-of-stock SKUs")
public class StockNotificationController {

    private final StockNotificationService stockNotificationService;

    @PostMapping("/notify_me")
    @Operation(summary = "Subscribe for stock notification", description = "Creates a stock notification subscription for the given email and SKU.")
    public ResponseEntity<StockNotificationResponse> notifyMe(@Valid @RequestBody StockNotificationRequest request) {
        StockNotificationResponse response = stockNotificationService.subscribe(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/fetch_all_notifications")
    @Operation(summary = "Fetch all notifications", description = "Fetches all stock notification entries for the given email address.")
    public ResponseEntity<FetchNotificationsResponse> fetchAllNotifications(
            @RequestParam(name = "email") String email) {
        FetchNotificationsResponse response = stockNotificationService.fetchAllNotifications(email);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/delete_notification")
    @Operation(summary = "Delete a notification", description = "Deletes a stock notification entry matching the provided id and email.")
    public ResponseEntity<StockNotificationResponse> deleteNotification(
            @RequestParam(name = "id") Long id,
            @RequestParam(name = "email") String email) {
        StockNotificationResponse response = stockNotificationService.deleteNotification(id, email);
        return ResponseEntity.ok(response);
    }


}
