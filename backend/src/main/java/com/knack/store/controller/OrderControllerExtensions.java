package com.knack.store.controller;

import com.knack.store.dto.OrderDTO;
import com.knack.store.service.OrderService;
import com.knack.store.util.ReturnEligibilityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Extended Controller methods for order return eligibility endpoints.
 * 
 * These methods extend the existing OrderController to provide:
 * - Return eligibility checks
 * - Return eligibility summaries
 * - Returnable items filtering
 * - Comprehensive return reports
 * 
 * ADD THESE METHODS TO YOUR EXISTING OrderController CLASS
 */
@Slf4j
public class OrderControllerExtensions {

    /**
     * EXAMPLE METHOD 1: Check if an order is eligible for return
     * 
     * GET /api/orders/{orderCode}/return-eligibility?email=customer@example.com
     * 
     * Response:
     * {
     *   "orderCode": "ORD-ABC12345",
     *   "status": "DELIVERED",
     *   "eligible": true,
     *   "placedDate": "2026-07-20T10:30:00",
     *   "daysRemainingForReturn": 5
     * }
     */
    public ResponseEntity<Map<String, Object>> checkReturnEligibility(
            OrderService orderService,
            @RequestParam String email,
            @PathVariable String orderCode) {
        log.info("Checking return eligibility for order: {} by customer: {}", orderCode, email);
        
        OrderDTO order = orderService.getOrderByCode(email, orderCode);
        
        Map<String, Object> response = new HashMap<>();
        response.put("orderCode", order.getOrderCode());
        response.put("status", order.getStatus());
        response.put("eligible", ReturnEligibilityUtil.isDTOEligibleForReturn(order));
        response.put("placedDate", order.getPlacedDate());
        
        if (order.getPlacedDate() != null) {
            long daysRemaining = java.time.temporal.ChronoUnit.DAYS
                    .between(java.time.LocalDateTime.now(), 
                    order.getPlacedDate().plusDays(10));
            response.put("daysRemainingForReturn", Math.max(0, daysRemaining));
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * EXAMPLE METHOD 2: Get return eligibility summary for an order
     * 
     * GET /api/orders/{orderCode}/return-summary?email=customer@example.com
     * 
     * Response:
     * {
     *   "orderEligible": true,
     *   "returnableItemCount": 2,
     *   "totalItemCount": 3,
     *   "daysRemainingForReturn": 5,
     *   "returnWindowDays": 10
     * }
     */
    public ResponseEntity<ReturnEligibilityUtil.ReturnEligibilitySummary> getReturnEligibilitySummary(
            OrderService orderService,
            @RequestParam String email,
            @PathVariable String orderCode) {
        log.info("Fetching return eligibility summary for order: {} by customer: {}", orderCode, email);
        
        OrderDTO order = orderService.getOrderByCode(email, orderCode);
        ReturnEligibilityUtil.ReturnEligibilitySummary summary = 
                ReturnEligibilityUtil.getReturnEligibilitySummaryFromDTO(order);
        
        return ResponseEntity.ok(summary);
    }

    /**
     * EXAMPLE METHOD 3: Get returnable items from an order
     * 
     * GET /api/orders/{orderCode}/returnable-items?email=customer@example.com
     * 
     * Response:
     * {
     *   "orderCode": "ORD-ABC12345",
     *   "totalItems": 3,
     *   "returnableItems": 2,
     *   "items": [
     *     {
     *       "productCode": "PROD-001",
     *       "productName": "Wireless Headphones",
     *       "quantity": 1,
     *       "unitPrice": 99.99,
     *       "eligibleForReturn": true
     *     },
     *     {
     *       "productCode": "PROD-002",
     *       "productName": "Phone Case",
     *       "quantity": 1,
     *       "unitPrice": 50.00,
     *       "eligibleForReturn": true
     *     }
     *   ]
     * }
     */
    public ResponseEntity<Map<String, Object>> getReturnableItems(
            OrderService orderService,
            @RequestParam String email,
            @PathVariable String orderCode) {
        log.info("Fetching returnable items for order: {} by customer: {}", orderCode, email);
        
        OrderDTO order = orderService.getOrderByCode(email, orderCode);
        List<OrderDTO.OrderEntryDTO> returnableItems = 
                ReturnEligibilityUtil.getReturnableEntriesFromDTO(order);
        
        Map<String, Object> response = new HashMap<>();
        response.put("orderCode", order.getOrderCode());
        response.put("totalItems", order.getEntries().size());
        response.put("returnableItems", returnableItems.size());
        response.put("items", returnableItems);
        
        return ResponseEntity.ok(response);
    }

    /**
     * EXAMPLE METHOD 4: Get comprehensive return report
     * 
     * GET /api/orders/{orderCode}/return-report?email=customer@example.com
     * 
     * Response:
     * {
     *   "orderCode": "ORD-ABC12345",
     *   "status": "DELIVERED",
     *   "placedDate": "2026-07-20T10:30:00",
     *   "deliveryDate": "2026-07-24",
     *   "orderEligibleForReturn": true,
     *   "daysRemainingForReturn": 5,
     *   "returnWindowDays": 10,
     *   "totalItems": 3,
     *   "returnableItems": 2,
     *   "nonReturnableItems": 1,
     *   "canReturnAllItems": false,
     *   "itemsDetail": {
     *     "returnable": [...],
     *     "nonReturnable": [...]
     *   },
     *   "summary": {
     *     "orderEligible": true,
     *     "returnableItemCount": 2,
     *     "totalItemCount": 3,
     *     "daysRemainingForReturn": 5,
     *     "returnWindowDays": 10
     *   }
     * }
     */
    public ResponseEntity<Map<String, Object>> getReturnReport(
            OrderService orderService,
            @RequestParam String email,
            @PathVariable String orderCode) {
        log.info("Generating return report for order: {} by customer: {}", orderCode, email);
        
        OrderDTO order = orderService.getOrderByCode(email, orderCode);
        ReturnEligibilityUtil.ReturnEligibilitySummary summary = 
                ReturnEligibilityUtil.getReturnEligibilitySummaryFromDTO(order);
        List<OrderDTO.OrderEntryDTO> returnableItems = 
                ReturnEligibilityUtil.getReturnableEntriesFromDTO(order);
        
        Map<String, Object> report = new HashMap<>();
        
        // Order Information
        report.put("orderCode", order.getOrderCode());
        report.put("status", order.getStatus());
        report.put("placedDate", order.getPlacedDate());
        report.put("deliveryDate", order.getDeliveryDate());
        
        // Return Eligibility Information
        report.put("orderEligibleForReturn", order.getEligibleForReturn());
        report.put("daysRemainingForReturn", summary.getDaysRemainingForReturn());
        report.put("returnWindowDays", summary.getReturnWindowDays());
        
        // Item Information
        report.put("totalItems", order.getEntries().size());
        report.put("returnableItems", returnableItems.size());
        report.put("nonReturnableItems", summary.getNonReturnableItemCount());
        report.put("canReturnAllItems", summary.canReturnAllItems());
        
        // Detailed Items
        Map<String, Object> itemsDetail = new HashMap<>();
        itemsDetail.put("returnable", returnableItems);
        itemsDetail.put("nonReturnable", 
                order.getEntries().stream()
                        .filter(item -> !ReturnEligibilityUtil.isEntryDTOEligibleForReturn(item))
                        .toList());
        report.put("itemsDetail", itemsDetail);
        
        // Summary
        report.put("summary", summary);
        
        return ResponseEntity.ok(report);
    }
}

/**
 * INSTRUCTIONS TO INTEGRATE:
 * 
 * 1. Add the following methods to your existing OrderController class:
 * 
 *    @GetMapping("/{orderCode}/return-eligibility")
 *    public ResponseEntity<Map<String, Object>> checkReturnEligibility(
 *            @RequestParam String email,
 *            @PathVariable String orderCode) {
 *        // Use the example method above
 *    }
 * 
 *    @GetMapping("/{orderCode}/return-summary")
 *    public ResponseEntity<ReturnEligibilityUtil.ReturnEligibilitySummary> getReturnEligibilitySummary(
 *            @RequestParam String email,
 *            @PathVariable String orderCode) {
 *        // Use the example method above
 *    }
 * 
 *    @GetMapping("/{orderCode}/returnable-items")
 *    public ResponseEntity<Map<String, Object>> getReturnableItems(
 *            @RequestParam String email,
 *            @PathVariable String orderCode) {
 *        // Use the example method above
 *    }
 * 
 *    @GetMapping("/{orderCode}/return-report")
 *    public ResponseEntity<Map<String, Object>> getReturnReport(
 *            @RequestParam String email,
 *            @PathVariable String orderCode) {
 *        // Use the example method above
 *    }
 * 
 * 2. Make sure OrderService is injected in OrderController (@RequiredArgsConstructor)
 * 3. Make sure @Slf4j annotation is present on OrderController
 * 4. Import ReturnEligibilityUtil in OrderController
 */

