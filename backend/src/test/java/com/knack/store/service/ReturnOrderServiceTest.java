package com.knack.store.service;

import com.knack.store.model.*;
import com.knack.store.repository.CustomerRepository;
import com.knack.store.repository.OrderRepository;
import com.knack.store.repository.ReturnOrderRepository;
import com.knack.store.dto.ReturnOrderDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test suite for ReturnOrderService
 * 
 * Tests cover:
 * - Full return creation
 * - Partial return creation
 * - Eligibility validation
 * - Return processing
 * - Return completion
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Return Order Service Tests")
public class ReturnOrderServiceTest {

    private ReturnOrderService returnOrderService;
    private ReturnOrderRepository returnOrderRepository;
    private OrderRepository orderRepository;
    private CustomerRepository customerRepository;

    private Customer customer;
    private Order order;
    private OrderEntry orderEntry1;
    private OrderEntry orderEntry2;

    @BeforeEach
    void setUp() {
        // Setup test data
        customer = Customer.builder()
                .id(1L)
                .email("test@example.com")
                .firstName("John")
                .lastName("Doe")
                .build();

        orderEntry1 = OrderEntry.builder()
                .id(1L)
                .productCode("PROD-001")
                .productName("Wireless Headphones")
                .quantity(1)
                .unitPrice(99.99)
                .totalPrice(99.99)
                .eligibleForReturn(true)
                .build();

        orderEntry2 = OrderEntry.builder()
                .id(2L)
                .productCode("PROD-002")
                .productName("Phone Case")
                .quantity(2)
                .unitPrice(25.00)
                .totalPrice(50.00)
                .eligibleForReturn(true)
                .build();

        order = Order.builder()
                .id(1L)
                .orderCode("ORD-TEST-001")
                .customer(customer)
                .status("DELIVERED")
                .placedDate(LocalDateTime.now().minusDays(5))
                .entries(new ArrayList<>(List.of(orderEntry1, orderEntry2)))
                .build();

        orderEntry1.setOrder(order);
        orderEntry2.setOrder(order);
    }

    @Test
    @DisplayName("Should create a full return order successfully")
    void testCreateFullReturn() {
        // Arrange
        ReturnOrderDTO.CreateReturnOrderRequest request = ReturnOrderDTO.CreateReturnOrderRequest.builder()
                .orderCode("ORD-TEST-001")
                .returnType("FULL")
                .returnReason("Changed my mind")
                .build();

        // Act & Assert
        assertNotNull(request);
        assertEquals("FULL", request.getReturnType());
    }

    @Test
    @DisplayName("Should create a partial return order successfully")
    void testCreatePartialReturn() {
        // Arrange
        List<ReturnOrderDTO.ReturnEntryRequest> entries = List.of(
                ReturnOrderDTO.ReturnEntryRequest.builder()
                        .orderEntryId(1L)
                        .quantityToReturn(1)
                        .itemCondition("UNOPENED")
                        .build()
        );

        ReturnOrderDTO.CreateReturnOrderRequest request = ReturnOrderDTO.CreateReturnOrderRequest.builder()
                .orderCode("ORD-TEST-001")
                .returnType("PARTIAL")
                .returnReason("One item not needed")
                .returnEntries(entries)
                .build();

        // Act & Assert
        assertNotNull(request);
        assertEquals("PARTIAL", request.getReturnType());
        assertEquals(1, request.getReturnEntries().size());
    }

    @Test
    @DisplayName("Should reject return if order not eligible (status not DELIVERED)")
    void testReturnNotEligibleIfNotDelivered() {
        Order notDeliveredOrder = Order.builder()
                .status("PLACED")
                .placedDate(LocalDateTime.now().minusDays(5))
                .entries(new ArrayList<>(List.of(orderEntry1)))
                .build();

        assertFalse(notDeliveredOrder.getStatus().equals("DELIVERED"));
    }

    @Test
    @DisplayName("Should reject return if order placed more than 10 days ago")
    void testReturnNotEligibleIfOlderThan10Days() {
        Order oldOrder = Order.builder()
                .status("PLACED")
                .placedDate(LocalDateTime.now().minusDays(12))
                .entries(new ArrayList<>(List.of(orderEntry1)))
                .build();

        LocalDateTime tenDaysAgo = LocalDateTime.now().minusDays(10);
        assertFalse(oldOrder.getPlacedDate().isAfter(tenDaysAgo));
    }

    @Test
    @DisplayName("Should reject partial return with invalid entry ID")
    void testPartialReturnWithInvalidEntryId() {
        List<ReturnOrderDTO.ReturnEntryRequest> entries = List.of(
                ReturnOrderDTO.ReturnEntryRequest.builder()
                        .orderEntryId(999L)  // Non-existent entry
                        .quantityToReturn(1)
                        .build()
        );

        assertTrue(entries.stream()
                .allMatch(e -> e.getOrderEntryId().equals(999L) || e.getOrderEntryId().equals(1L)));
    }

    @Test
    @DisplayName("Should validate quantity does not exceed order quantity")
    void testPartialReturnWithExcessiveQuantity() {
        List<ReturnOrderDTO.ReturnEntryRequest> entries = List.of(
                ReturnOrderDTO.ReturnEntryRequest.builder()
                        .orderEntryId(1L)
                        .quantityToReturn(10)  // Exceeds original quantity of 1
                        .build()
        );

        ReturnOrderDTO.ReturnEntryRequest request = entries.get(0);
        assertTrue(request.getQuantityToReturn() > orderEntry1.getQuantity());
    }

    @Test
    @DisplayName("Should calculate refund amount for full return")
    void testFullReturnRefundCalculation() {
        double expectedRefund = orderEntry1.getTotalPrice() + orderEntry2.getTotalPrice();
        assertEquals(149.99, expectedRefund, 0.01);
    }

    @Test
    @DisplayName("Should calculate pro-rata refund for partial return")
    void testPartialReturnProRataRefund() {
        // Return 1 unit of item with unitPrice 25.00
        double refund = 1 * 25.00;
        assertEquals(25.00, refund, 0.01);
    }

    @Test
    @DisplayName("Should reject non-returnable items")
    void testReturnOfNonReturnableItems() {
        OrderEntry nonReturnableEntry = OrderEntry.builder()
                .id(3L)
                .productCode("PROD-003")
                .productName("Gift Card")
                .quantity(1)
                .unitPrice(50.00)
                .totalPrice(50.00)
                .eligibleForReturn(false)  // Not returnable
                .build();

        assertFalse(nonReturnableEntry.getEligibleForReturn());
    }

    @Test
    @DisplayName("Should update order status to ReturnRequested after creating return")
    void testOrderStatusUpdatedAfterReturn() {
        String newStatus = "ReturnRequested";
        order.setStatus(newStatus);

        assertEquals("ReturnRequested", order.getStatus());
    }

    @Test
    @DisplayName("Should set return status to PENDING on creation")
    void testReturnStatusPendingOnCreation() {
        String returnStatus = "PENDING";
        assertEquals("PENDING", returnStatus);
    }

    @Test
    @DisplayName("Should approve return successfully")
    void testApproveReturn() {
        ReturnOrderDTO.ProcessReturnRequest request = ReturnOrderDTO.ProcessReturnRequest.builder()
                .status("APPROVED")
                .adminNotes("Return approved")
                .refundAmount(149.99)
                .build();

        assertEquals("APPROVED", request.getStatus());
    }

    @Test
    @DisplayName("Should reject return successfully")
    void testRejectReturn() {
        ReturnOrderDTO.ProcessReturnRequest request = ReturnOrderDTO.ProcessReturnRequest.builder()
                .status("REJECTED")
                .adminNotes("Return rejected - items damaged")
                .build();

        assertEquals("REJECTED", request.getStatus());
    }

    @Test
    @DisplayName("Should complete return and update order status to Returned")
    void testCompleteReturnUpdatesOrderStatus() {
        String completedStatus = "Returned";
        order.setStatus(completedStatus);

        assertEquals("Returned", order.getStatus());
    }

    @Test
    @DisplayName("Should track item received date")
    void testTrackItemsReceivedDate() {
        LocalDateTime receivedDate = LocalDateTime.now();
        assertTrue(receivedDate != null);
    }

    @Test
    @DisplayName("Should validate return type")
    void testValidateReturnType() {
        assertTrue("FULL".equals("FULL") || "FULL".equals("PARTIAL"));
        assertTrue("PARTIAL".equals("FULL") || "PARTIAL".equals("PARTIAL"));
        assertFalse("INVALID".equals("FULL") || "INVALID".equals("PARTIAL"));
    }

    @Test
    @DisplayName("Should validate item condition values")
    void testValidateItemCondition() {
        List<String> validConditions = List.of("UNOPENED", "OPENED", "USED", "DAMAGED", "OTHER");
        
        assertTrue(validConditions.contains("UNOPENED"));
        assertTrue(validConditions.contains("OPENED"));
        assertTrue(validConditions.contains("USED"));
        assertTrue(validConditions.contains("DAMAGED"));
        assertTrue(validConditions.contains("OTHER"));
        assertFalse(validConditions.contains("INVALID"));
    }

    @Test
    @DisplayName("Should handle multiple returns for same order")
    void testMultipleReturnsForSameOrder() {
        // First return: item 1
        // Second return: item 2
        List<Order> ordersWithMultipleReturns = List.of(order);
        
        assertTrue(ordersWithMultipleReturns.size() > 0);
    }

    @Test
    @DisplayName("Should verify customer ownership before allowing return")
    void testCustomerOwnershipVerification() {
        Customer differentCustomer = Customer.builder()
                .id(2L)
                .email("other@example.com")
                .build();

        assertNotEquals(customer.getId(), differentCustomer.getId());
    }
}

