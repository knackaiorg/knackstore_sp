package com.knack.store.service;

import com.knack.store.dto.ReturnOrderDTO;
import com.knack.store.dto.ReturnOrderEntryDTO;
import com.knack.store.model.*;
import com.knack.store.repository.CustomerRepository;
import com.knack.store.repository.OrderRepository;
import com.knack.store.repository.ReturnOrderRepository;
import com.knack.store.util.ReturnEligibilityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing return orders
 * 
 * Handles:
 * - Creating return requests
 * - Validating return eligibility
 * - Processing return approvals/rejections
 * - Tracking return status
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReturnOrderService {

    private final ReturnOrderRepository returnOrderRepository;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;

    /**
     * Create a return request for an order
     * 
     * @param email customer email
     * @param request return request details
     * @return response with return code and status
     */
    @Transactional
    public ReturnOrderDTO.CreateReturnOrderResponse createReturnOrder(String email, ReturnOrderDTO.CreateReturnOrderRequest request) {
        log.info("Creating return order for customer: {} for order: {}", email, request.getOrderCode());

        try {
            // Step 1: Verify customer exists
            Customer customer = customerRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));

            // Step 2: Find the order
            Order order = orderRepository.findByOrderCode(request.getOrderCode())
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            // Step 3: Verify customer owns the order
            if (!order.getCustomer().getId().equals(customer.getId())) {
                throw new RuntimeException("Access denied: Order does not belong to this customer");
            }

            // Step 4: Check order-level eligibility
            if (!ReturnEligibilityUtil.isOrderEligibleForReturn(order)) {
                throw new RuntimeException("Order is not eligible for return. Must be DELIVERED within 10 days.");
            }

            // Step 5: Validate return type and entries
            String returnType = request.getReturnType();
            if (!returnType.equals("FULL") && !returnType.equals("PARTIAL")) {
                throw new RuntimeException("Invalid return type. Must be FULL or PARTIAL");
            }

            List<ReturnOrderEntry> returnEntries = new ArrayList<>();
            Double totalRefund = 0.0;

            if (returnType.equals("FULL")) {
                // Full return - all eligible items
                returnEntries = order.getEntries().stream()
                        .filter(entry -> ReturnEligibilityUtil.isEntryEligibleForReturn(entry))
                        .map(entry -> ReturnOrderEntry.builder()
                                .orderEntry(entry)
                                .quantityReturned(entry.getQuantity())
                                .refundAmount(entry.getTotalPrice())
                                .itemCondition("UNOPENED")  // Default condition
                                .build())
                        .collect(Collectors.toList());

                totalRefund = returnEntries.stream()
                        .mapToDouble(e -> e.getRefundAmount() != null ? e.getRefundAmount() : 0.0)
                        .sum();
            } else {
                // Partial return - specified items only
                if (request.getReturnEntries() == null || request.getReturnEntries().isEmpty()) {
                    throw new RuntimeException("Partial return must include at least one item");
                }

                for (ReturnOrderDTO.ReturnEntryRequest entryRequest : request.getReturnEntries()) {
                    // Find the order entry
                    OrderEntry orderEntry = order.getEntries().stream()
                            .filter(e -> e.getId().equals(entryRequest.getOrderEntryId()))
                            .findFirst()
                            .orElseThrow(() -> new RuntimeException("Order entry not found: " + entryRequest.getOrderEntryId()));

                    // Check entry-level eligibility
                    if (!ReturnEligibilityUtil.isEntryEligibleForReturn(orderEntry)) {
                        throw new RuntimeException("Item " + orderEntry.getProductName() + " is not eligible for return");
                    }

                    // Validate quantity
                    if (entryRequest.getQuantityToReturn() > orderEntry.getQuantity()) {
                        throw new RuntimeException("Cannot return more than purchased quantity for " + orderEntry.getProductName());
                    }

                    // Calculate refund amount (pro-rata based on quantity)
                    double refundPerUnit = orderEntry.getUnitPrice() != null ? orderEntry.getUnitPrice() : 0.0;
                    double entryRefund = refundPerUnit * entryRequest.getQuantityToReturn();

                    ReturnOrderEntry returnEntry = ReturnOrderEntry.builder()
                            .orderEntry(orderEntry)
                            .quantityReturned(entryRequest.getQuantityToReturn())
                            .refundAmount(entryRefund)
                            .itemCondition(entryRequest.getItemCondition() != null ? entryRequest.getItemCondition() : "UNOPENED")
                            .notes(entryRequest.getNotes())
                            .build();

                    returnEntries.add(returnEntry);
                    totalRefund += entryRefund;
                }
            }

            // Step 6: Create ReturnOrder
            String returnCode = "RET-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

            ReturnOrder returnOrder = ReturnOrder.builder()
                    .returnCode(returnCode)
                    .order(order)
                    .customer(customer)
                    .status("PENDING")
                    .returnType(returnType)
                    .returnReason(request.getReturnReason())
                    .returnEntries(returnEntries)
                    .refundAmount(totalRefund)
                    .requestedDate(LocalDateTime.now())
                    .returnTrackingNumber(request.getReturnTrackingNumber())
                    .lastModifiedDate(LocalDateTime.now())
                    .build();

            // Set the return order reference in entries
            returnEntries.forEach(entry -> entry.setReturnOrder(returnOrder));

            // Save return order
            ReturnOrder savedReturnOrder = returnOrderRepository.save(returnOrder);

            // Step 7: Update order status to "ReturnRequested"
            order.setStatus("RETURN_REQUESTED");
            order.setLastModifiedDate(LocalDateTime.now());
            orderRepository.save(order);

            log.info("Return order created successfully: {} with refund amount: {}", returnCode, totalRefund);

            return ReturnOrderDTO.CreateReturnOrderResponse.builder()
                    .success(true)
                    .message("Return request created successfully")
                    .returnCode(returnCode)
                    .status("PENDING")
                    .estimatedRefund(totalRefund)
                    .build();

        } catch (RuntimeException e) {
            log.error("Error creating return order: {}", e.getMessage());
            return ReturnOrderDTO.CreateReturnOrderResponse.builder()
                    .success(false)
                    .message("Error: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Get return orders for a customer
     * 
     * @param email customer email
     * @return list of return orders
     */
    public List<ReturnOrderDTO> getReturnOrders(String email) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        return returnOrderRepository.findByCustomerId(customer.getId())
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific return order
     * 
     * @param email customer email
     * @param returnCode return order code
     * @return return order details
     */
    public ReturnOrderDTO getReturnOrder(String email, String returnCode) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        ReturnOrder returnOrder = returnOrderRepository.findByReturnCode(returnCode)
                .orElseThrow(() -> new RuntimeException("Return order not found"));

        // Verify customer owns this return
        if (!returnOrder.getCustomer().getId().equals(customer.getId())) {
            throw new RuntimeException("Access denied: Return order does not belong to this customer");
        }

        return toDTO(returnOrder);
    }

    /**
     * Get return orders for a specific order
     * 
     * @param email customer email
     * @param orderCode order code
     * @return list of return orders for that order
     */
    public List<ReturnOrderDTO> getReturnOrdersForOrder(String email, String orderCode) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Verify customer owns the order
        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new RuntimeException("Access denied: Order does not belong to this customer");
        }

        return returnOrderRepository.findByOrderId(order.getId())
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Process a return order (approve or reject)
     * Admin only operation
     * 
     * Process a return order (approve or reject)
     * 
     * Special Logic for DEFECT_PRODUCT:
     * - If returnReason = "DEFECT_PRODUCT" and status = "APPROVED"
     * - Status automatically changes to "COMPLETED" (no admin approval needed)
     * - Items automatically marked as received
     * - Ready for immediate refund processing
     * 
     * Admin only operation
     * 
     * @param returnCode return order code
     * @param request approval/rejection request
     * @return updated return order
     */
    @Transactional
    public ReturnOrderDTO processReturn(String returnCode, ReturnOrderDTO.ProcessReturnRequest request) {
        log.info("Processing return order: {} with status: {}", returnCode, request.getStatus());

        ReturnOrder returnOrder = returnOrderRepository.findByReturnCode(returnCode)
                .orElseThrow(() -> new RuntimeException("Return order not found"));

        if (!request.getStatus().equals("APPROVED") && !request.getStatus().equals("REJECTED")) {
            throw new RuntimeException("Invalid status. Must be APPROVED or REJECTED");
        }

        returnOrder.setStatus(request.getStatus());
        returnOrder.setAdminNotes(request.getAdminNotes());
        if (request.getRefundAmount() != null) {
            returnOrder.setRefundAmount(request.getRefundAmount());
        }
        returnOrder.setProcessedDate(LocalDateTime.now());
        returnOrder.setLastModifiedDate(LocalDateTime.now());

        // Auto-complete and mark as received if DEFECT_PRODUCT and APPROVED
        if ("APPROVED".equals(request.getStatus()) && 
            returnOrder.getReturnReason() != null && 
            returnOrder.getReturnReason().equals("DEFECT_PRODUCT")) {
            
            log.info("Auto-completing return order: {} (DEFECT_PRODUCT detected)", returnCode);
            
            // Automatically set status to COMPLETED
            returnOrder.setStatus("COMPLETED");
            
            // Automatically mark items as received
            returnOrder.setItemsReceived(true);
            returnOrder.setItemsReceivedDate(LocalDateTime.now());
            returnOrder.setCompletedDate(LocalDateTime.now());
            
            log.info("Return order auto-completed: {} - ready for refund processing", returnCode);
        }

        ReturnOrder savedReturnOrder = returnOrderRepository.save(returnOrder);
        log.info("Return order processed: {} with status: {}", returnCode, savedReturnOrder.getStatus());

        return toDTO(savedReturnOrder);
    }

    /**
     * Mark return items as received
     * 
     * @param returnCode return order code
     * @param request marking details
     * @return updated return order
     */
    @Transactional
    public ReturnOrderDTO markItemsReceived(String returnCode, ReturnOrderDTO.MarkItemsReceivedRequest request) {
        log.info("Marking items received for return order: {}", returnCode);

        ReturnOrder returnOrder = returnOrderRepository.findByReturnCode(returnCode)
                .orElseThrow(() -> new RuntimeException("Return order not found"));

        returnOrder.setItemsReceived(request.getItemsReceived());
        if (request.getItemsReceived() != null && request.getItemsReceived()) {
            returnOrder.setItemsReceivedDate(LocalDateTime.now());
            // Don't change status to COMPLETED if the return has been REJECTED
            if (returnOrder.getStatus() == null || !returnOrder.getStatus().equals("REJECTED")) {
                returnOrder.setStatus("COMPLETED");
            }
        }
        returnOrder.setLastModifiedDate(LocalDateTime.now());

        ReturnOrder savedReturnOrder = returnOrderRepository.save(returnOrder);
        return toDTO(savedReturnOrder);
    }

    /**
     * Complete a return (mark as completed and update order status)
     * 
     * @param returnCode return order code
     * @return updated return order
     */
    @Transactional
    public ReturnOrderDTO completeReturn(String returnCode) {
        log.info("Completing return order: {}", returnCode);

        ReturnOrder returnOrder = returnOrderRepository.findByReturnCode(returnCode)
                .orElseThrow(() -> new RuntimeException("Return order not found"));

        returnOrder.setStatus("COMPLETED");
        returnOrder.setCompletedDate(LocalDateTime.now());
        returnOrder.setLastModifiedDate(LocalDateTime.now());

        ReturnOrder savedReturnOrder = returnOrderRepository.save(returnOrder);

        // Update original order status
        Order order = returnOrder.getOrder();
        order.setStatus("Returned");
        order.setLastModifiedDate(LocalDateTime.now());
        orderRepository.save(order);

        log.info("Return order completed: {}", returnCode);
        return toDTO(savedReturnOrder);
    }

    /**
     * Get all return orders eligible for refund processing
     * 
     * Eligible returns are those with:
     * - Status = COMPLETED
     * - Items received = true
     * - Not already REFUNDED
     * 
     * ADMIN ONLY
     * 
     * @return list of refund-eligible return orders
     */
    public List<ReturnOrderDTO> getRefundEligibleReturns() {
        log.info("Fetching refund-eligible return orders");
        
        List<ReturnOrder> eligibleReturns = returnOrderRepository.findByStatus("COMPLETED");
        
        return eligibleReturns.stream()
                .filter(r -> r.getItemsReceived() != null && r.getItemsReceived())
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all refunded return orders
     * 
     * ADMIN ONLY
     * 
     * @return list of refunded return orders
     */
    public List<ReturnOrderDTO> getRefundedReturns() {
        log.info("Fetching refunded return orders");
        
        return returnOrderRepository.findByStatus("REFUNDED")
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Process refunds for all eligible return orders
     * 
     * For each eligible return:
     * - Verify it has items received
     * - Update status to REFUNDED
     * - Record processing timestamp
     * 
     * ADMIN ONLY
     * 
     * @return summary of processed refunds
     */
    @Transactional
    public Map<String, Object> processRefundsForEligibleReturns() {
        log.info("Processing refunds for all eligible return orders");
        
        try {
            List<ReturnOrder> eligibleReturns = returnOrderRepository.findByStatus("COMPLETED");
            
            int processedCount = 0;
            double totalRefundAmount = 0.0;
            List<String> processedReturnCodes = new ArrayList<>();
            
            for (ReturnOrder returnOrder : eligibleReturns) {
                // Only process if items have been received
                if (returnOrder.getItemsReceived() != null && returnOrder.getItemsReceived()) {
                    returnOrder.setStatus("REFUNDED");
                    returnOrder.setLastModifiedDate(LocalDateTime.now());
                    
                    ReturnOrder savedReturn = returnOrderRepository.save(returnOrder);
                    
                    processedCount++;
                    if (savedReturn.getRefundAmount() != null) {
                        totalRefundAmount += savedReturn.getRefundAmount();
                    }
                    processedReturnCodes.add(savedReturn.getReturnCode());
                    
                    log.info("Refund processed for return order: {}", savedReturn.getReturnCode());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", String.format("Successfully processed %d refunds", processedCount));
            response.put("processedCount", processedCount);
            response.put("totalRefundAmount", totalRefundAmount);
            response.put("processedReturnCodes", processedReturnCodes);
            response.put("processedDate", LocalDateTime.now());
            
            log.info("Refund processing completed: {} refunds processed, total amount: {}", 
                    processedCount, totalRefundAmount);
            
            return response;
            
        } catch (Exception e) {
            log.error("Error processing refunds: {}", e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error processing refunds: " + e.getMessage());
            
            return errorResponse;
        }
    }

    /**
     * Process refund for a specific return order
     * 
     * ADMIN ONLY
     * 
     * @param returnCode return order code
     * @return updated return order
     */
    @Transactional
    public ReturnOrderDTO processRefundForReturn(String returnCode) {
        log.info("Processing refund for return order: {}", returnCode);
        
        ReturnOrder returnOrder = returnOrderRepository.findByReturnCode(returnCode)
                .orElseThrow(() -> new RuntimeException("Return order not found"));
        
        if (returnOrder.getStatus() == null || !returnOrder.getStatus().equals("COMPLETED")) {
            throw new RuntimeException("Return order must be COMPLETED to process refund");
        }
        
        if (returnOrder.getItemsReceived() == null || !returnOrder.getItemsReceived()) {
            throw new RuntimeException("Items must be received before processing refund");
        }
        
        returnOrder.setStatus("REFUNDED");
        returnOrder.setLastModifiedDate(LocalDateTime.now());
        
        ReturnOrder savedReturnOrder = returnOrderRepository.save(returnOrder);
        
        log.info("Refund processed for return order: {}", returnCode);
        return toDTO(savedReturnOrder);
    }

    /**
     * Convert ReturnOrder entity to DTO
     */
    private ReturnOrderDTO toDTO(ReturnOrder returnOrder) {
        return ReturnOrderDTO.builder()
                .id(returnOrder.getId())
                .returnCode(returnOrder.getReturnCode())
                .orderCode(returnOrder.getOrder().getOrderCode())
                .status(returnOrder.getStatus())
                .returnType(returnOrder.getReturnType())
                .returnReason(returnOrder.getReturnReason())
                .refundAmount(returnOrder.getRefundAmount())
                .requestedDate(returnOrder.getRequestedDate())
                .processedDate(returnOrder.getProcessedDate())
                .completedDate(returnOrder.getCompletedDate())
                .itemsReceived(returnOrder.getItemsReceived())
                .itemsReceivedDate(returnOrder.getItemsReceivedDate())
                .returnTrackingNumber(returnOrder.getReturnTrackingNumber())
                .adminNotes(returnOrder.getAdminNotes())
                .returnEntries(returnOrder.getReturnEntries().stream()
                        .map(this::toEntryDTO)
                        .collect(Collectors.toList()))
                .build();
    }

    /**
     * Convert ReturnOrderEntry entity to DTO
     */
    private ReturnOrderEntryDTO toEntryDTO(ReturnOrderEntry entry) {
        OrderEntry orderEntry = entry.getOrderEntry();
        return ReturnOrderEntryDTO.builder()
                .id(entry.getId())
                .orderEntryId(orderEntry.getId())
                .productCode(orderEntry.getProductCode())
                .productName(orderEntry.getProductName())
                .quantity(orderEntry.getQuantity())
                .unitPrice(orderEntry.getUnitPrice())
                .quantityReturned(entry.getQuantityReturned())
                .refundAmount(entry.getRefundAmount())
                .itemCondition(entry.getItemCondition())
                .notes(entry.getNotes())
                .build();
    }
}

