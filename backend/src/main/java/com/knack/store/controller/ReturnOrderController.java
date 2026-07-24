package com.knack.store.controller;

import com.knack.store.dto.ReturnOrderDTO;
import com.knack.store.service.ReturnOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for managing return orders
 * 
 * Provides endpoints for:
 * - Creating return requests
 * - Viewing return order status
 * - Processing returns (admin)
 */
@RestController
@RequestMapping("/api/return-orders")
@RequiredArgsConstructor
@Slf4j
public class ReturnOrderController {

    private final ReturnOrderService returnOrderService;

    /**
     * Create a return request for an order
     * 
     * Customer can return the full order or selected items if eligible
     * 
     * @param email customer email (from authentication)
     * @param request return request details
     * @return return order response with return code and estimated refund
     */
    @PostMapping("/create")
    public ResponseEntity<ReturnOrderDTO.CreateReturnOrderResponse> createReturnOrder(
            @RequestParam String email,
            @RequestBody ReturnOrderDTO.CreateReturnOrderRequest request) {
        log.info("Create return order request from customer: {}", email);
        
        ReturnOrderDTO.CreateReturnOrderResponse response = returnOrderService.createReturnOrder(email, request);
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Get all return orders for the current customer
     * 
     * @param email customer email (from authentication)
     * @return list of return orders
     */
    @GetMapping("/my-returns")
    public ResponseEntity<List<ReturnOrderDTO>> getMyReturnOrders(
            @RequestParam String email) {
        log.info("Fetching return orders for customer: {}", email);
        
        List<ReturnOrderDTO> returnOrders = returnOrderService.getReturnOrders(email);
        return ResponseEntity.ok(returnOrders);
    }

    /**
     * Get details of a specific return order
     * 
     * @param email customer email (from authentication)
     * @param returnCode return order code
     * @return return order details
     */
    @GetMapping("/{returnCode}")
    public ResponseEntity<ReturnOrderDTO> getReturnOrder(
            @RequestParam String email,
            @PathVariable String returnCode) {
        log.info("Fetching return order: {} for customer: {}", returnCode, email);
        
        ReturnOrderDTO returnOrder = returnOrderService.getReturnOrder(email, returnCode);
        return ResponseEntity.ok(returnOrder);
    }

    /**
     * Get all return orders for a specific order
     * 
     * @param email customer email (from authentication)
     * @param orderCode order code
     * @return list of return orders for that order
     */
    @GetMapping("/order/{orderCode}")
    public ResponseEntity<List<ReturnOrderDTO>> getReturnOrdersForOrder(
            @RequestParam String email,
            @PathVariable String orderCode) {
        log.info("Fetching return orders for order: {} by customer: {}", orderCode, email);
        
        List<ReturnOrderDTO> returnOrders = returnOrderService.getReturnOrdersForOrder(email, orderCode);
        return ResponseEntity.ok(returnOrders);
    }

    /**
     * Process a return order (approve or reject)
     * ADMIN ENDPOINT
     * 
     * Special Logic for DEFECT_PRODUCT:
     * - If return reason is "DEFECT_PRODUCT" and status is "APPROVED"
     * - Status automatically changes to "COMPLETED" (no admin approval needed)
     * - Items automatically marked as received
     * - Ready for immediate refund processing
     * 
     * @param returnCode return order code
     * @param request approval/rejection request with admin notes
     * @return updated return order
     */
    @PutMapping("/{returnCode}/process")
    public ResponseEntity<ReturnOrderDTO> processReturn(
            @PathVariable String returnCode,
            @RequestBody ReturnOrderDTO.ProcessReturnRequest request) {
        log.info("Processing return order: {} with status: {}", returnCode, request.getStatus());
        
        ReturnOrderDTO returnOrder = returnOrderService.processReturn(returnCode, request);
        return ResponseEntity.ok(returnOrder);
    }

    /**
     * Mark returned items as received
     * ADMIN ENDPOINT
     * 
     * @param returnCode return order code
     * @param request marking request
     * @return updated return order
     */
    @PutMapping("/{returnCode}/mark-received")
    public ResponseEntity<ReturnOrderDTO> markItemsReceived(
            @PathVariable String returnCode,
            @RequestBody ReturnOrderDTO.MarkItemsReceivedRequest request) {
        log.info("Marking items received for return order: {}", returnCode);
        
        ReturnOrderDTO returnOrder = returnOrderService.markItemsReceived(returnCode, request);
        return ResponseEntity.ok(returnOrder);
    }

    /**
     * Complete a return and process refund
     * ADMIN ENDPOINT
     * 
     * @param returnCode return order code
     * @return completed return order
     */
    @PutMapping("/{returnCode}/complete")
    public ResponseEntity<ReturnOrderDTO> completeReturn(
            @PathVariable String returnCode) {
        log.info("Completing return order: {}", returnCode);
        
        ReturnOrderDTO returnOrder = returnOrderService.completeReturn(returnCode);
        return ResponseEntity.ok(returnOrder);
    }

    /**
     * Get all return orders eligible for refund processing
     * 
     * ADMIN ENDPOINT
     * 
     * Fetches all return orders that are:
     * - Status = COMPLETED
     * - Items received = true
     * - Not already REFUNDED
     * 
     * @return list of refund-eligible return orders
     */
    @GetMapping("/admin/refund-eligible")
    public ResponseEntity<List<ReturnOrderDTO>> getRefundEligibleReturns() {
        log.info("Fetching refund-eligible return orders");
        
        List<ReturnOrderDTO> eligibleReturns = returnOrderService.getRefundEligibleReturns();
        return ResponseEntity.ok(eligibleReturns);
    }

    /**
     * Get all refunded return orders
     * 
     * ADMIN ENDPOINT
     * 
     * @return list of refunded return orders
     */
    @GetMapping("/admin/refunded")
    public ResponseEntity<List<ReturnOrderDTO>> getRefundedReturns() {
        log.info("Fetching refunded return orders");
        
        List<ReturnOrderDTO> refundedReturns = returnOrderService.getRefundedReturns();
        return ResponseEntity.ok(refundedReturns);
    }

    /**
     * Process refunds for all eligible return orders
     * 
     * ADMIN ENDPOINT
     * 
     * This endpoint:
     * 1. Finds all COMPLETED returns with items received
     * 2. Updates their status to REFUNDED
     * 3. Records processing timestamps
     * 4. Returns summary of processed refunds
     * 
     * @return refund processing summary
     */
    @PostMapping("/admin/process-refunds")
    public ResponseEntity<Map<String, Object>> processRefundsForEligibleReturns() {
        log.info("Processing refunds for all eligible return orders");
        
        Map<String, Object> result = returnOrderService.processRefundsForEligibleReturns();
        
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * Process refund for a specific return order
     * 
     * ADMIN ENDPOINT
     * 
     * @param returnCode return order code
     * @return updated return order with status REFUNDED
     */
    @PostMapping("/{returnCode}/process-refund")
    public ResponseEntity<ReturnOrderDTO> processRefundForReturn(
            @PathVariable String returnCode) {
        log.info("Processing refund for return order: {}", returnCode);
        
        try {
            ReturnOrderDTO returnOrder = returnOrderService.processRefundForReturn(returnCode);
            return ResponseEntity.ok(returnOrder);
        } catch (RuntimeException e) {
            log.error("Error processing refund: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}

