package com.knack.store.service;

import com.knack.store.model.*;
import com.knack.store.util.ReturnEligibilityUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test suite for return eligibility feature.
 * 
 * Tests cover:
 * - Order eligibility based on status and time
 * - Entry-level eligibility
 * - Returnable items filtering
 * - Return eligibility summaries
 * - Edge cases and boundary conditions
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Return Eligibility Tests")
public class ReturnEligibilityTest {

    private Order order;
    private OrderEntry entry;
    private Product product;

    @BeforeEach
    void setUp() {
        // Create sample product
        product = Product.builder()
                .id(1L)
                .code("PROD-001")
                .name("Test Product")
                .basePrice(99.99)
                .eligibleForReturn(true)
                .build();

        // Create sample order entry
        entry = OrderEntry.builder()
                .id(1L)
                .productCode("PROD-001")
                .productName("Test Product")
                .quantity(1)
                .unitPrice(99.99)
                .totalPrice(99.99)
                .eligibleForReturn(true)
                .build();

        // Create sample order
        order = Order.builder()
                .id(1L)
                .orderCode("ORD-TEST-001")
                .status("DELIVERED")
                .placedDate(LocalDateTime.now().minusDays(5))
                .entries(new ArrayList<>(List.of(entry)))
                .build();
    }

    // ======================
    // ORDER ELIGIBILITY TESTS
    // ======================

    @Test
    @DisplayName("Order should be eligible for return within 10 days with DELIVERED status")
    void testOrderEligibleWithin10Days() {
        order.setStatus("DELIVERED");
        order.setPlacedDate(LocalDateTime.now().minusDays(5));

        boolean result = ReturnEligibilityUtil.isOrderEligibleForReturn(order);

        assertTrue(result, "Order placed 5 days ago with DELIVERED status should be eligible");
    }

    @Test
    @DisplayName("Order should not be eligible for return after 10 days")
    void testOrderNotEligibleAfter10Days() {
        order.setStatus("DELIVERED");
        order.setPlacedDate(LocalDateTime.now().minusDays(12));

        boolean result = ReturnEligibilityUtil.isOrderEligibleForReturn(order);

        assertFalse(result, "Order placed 12 days ago should not be eligible");
    }

    @Test
    @DisplayName("Order should be eligible exactly on day 10")
    void testOrderEligibleOn10thDay() {
        order.setStatus("DELIVERED");
        order.setPlacedDate(LocalDateTime.now().minusDays(10).plusHours(1));

        boolean result = ReturnEligibilityUtil.isOrderEligibleForReturn(order);

        assertTrue(result, "Order placed on day 10 should be eligible");
    }

    @Test
    @DisplayName("Order should not be eligible if status is not DELIVERED")
    void testOrderNotEligibleIfNotDelivered() {
        order.setStatus("PLACED");
        order.setPlacedDate(LocalDateTime.now().minusDays(5));

        boolean result = ReturnEligibilityUtil.isOrderEligibleForReturn(order);

        assertFalse(result, "Order with PLACED status should not be eligible");
    }

    @Test
    @DisplayName("Order should not be eligible if status is CANCELLED")
    void testOrderNotEligibleIfCancelled() {
        order.setStatus("CANCELLED");
        order.setPlacedDate(LocalDateTime.now().minusDays(5));

        boolean result = ReturnEligibilityUtil.isOrderEligibleForReturn(order);

        assertFalse(result, "Cancelled order should not be eligible");
    }

    @Test
    @DisplayName("Order should not be eligible if status is IN_TRANSIT")
    void testOrderNotEligibleIfInTransit() {
        order.setStatus("IN_TRANSIT");
        order.setPlacedDate(LocalDateTime.now().minusDays(5));

        boolean result = ReturnEligibilityUtil.isOrderEligibleForReturn(order);

        assertFalse(result, "Order in transit should not be eligible");
    }

    @Test
    @DisplayName("Order should not be eligible if null")
    void testNullOrderNotEligible() {
        boolean result = ReturnEligibilityUtil.isOrderEligibleForReturn(null);

        assertFalse(result, "Null order should not be eligible");
    }

    @Test
    @DisplayName("Order should not be eligible if placed date is null")
    void testOrderNotEligibleIfNoPlacedDate() {
        order.setStatus("DELIVERED");
        order.setPlacedDate(null);

        boolean result = ReturnEligibilityUtil.isOrderEligibleForReturn(order);

        assertFalse(result, "Order with no placed date should not be eligible");
    }

    @Test
    @DisplayName("Order with custom return window should respect the window")
    void testOrderWithCustomReturnWindow() {
        order.setStatus("DELIVERED");
        order.setPlacedDate(LocalDateTime.now().minusDays(15));

        // Not eligible with 10 day window
        assertFalse(ReturnEligibilityUtil.isOrderEligibleForReturn(order, 10));

        // Eligible with 20 day window
        assertTrue(ReturnEligibilityUtil.isOrderEligibleForReturn(order, 20));
    }

    // ======================
    // ENTRY ELIGIBILITY TESTS
    // ======================

    @Test
    @DisplayName("Entry should be eligible if eligibleForReturn is true")
    void testEntryEligibleWhenTrue() {
        entry.setEligibleForReturn(true);

        boolean result = ReturnEligibilityUtil.isEntryEligibleForReturn(entry);

        assertTrue(result);
    }

    @Test
    @DisplayName("Entry should not be eligible if eligibleForReturn is false")
    void testEntryNotEligibleWhenFalse() {
        entry.setEligibleForReturn(false);

        boolean result = ReturnEligibilityUtil.isEntryEligibleForReturn(entry);

        assertFalse(result);
    }

    @Test
    @DisplayName("Entry should not be eligible if eligibleForReturn is null")
    void testEntryNotEligibleWhenNull() {
        entry.setEligibleForReturn(null);

        boolean result = ReturnEligibilityUtil.isEntryEligibleForReturn(entry);

        assertFalse(result);
    }

    @Test
    @DisplayName("Null entry should not be eligible")
    void testNullEntryNotEligible() {
        boolean result = ReturnEligibilityUtil.isEntryEligibleForReturn(null);

        assertFalse(result);
    }

    // ======================
    // FILTERING TESTS
    // ======================

    @Test
    @DisplayName("Should filter returnable entries correctly")
    void testGetReturnableEntries() {
        OrderEntry entry1 = OrderEntry.builder()
                .productCode("PROD-001")
                .eligibleForReturn(true)
                .build();

        OrderEntry entry2 = OrderEntry.builder()
                .productCode("PROD-002")
                .eligibleForReturn(false)
                .build();

        OrderEntry entry3 = OrderEntry.builder()
                .productCode("PROD-003")
                .eligibleForReturn(true)
                .build();

        order.setEntries(List.of(entry1, entry2, entry3));

        List<OrderEntry> returnableEntries = ReturnEligibilityUtil.getReturnableEntries(order);

        assertEquals(2, returnableEntries.size());
        assertTrue(returnableEntries.stream().allMatch(e -> e.getEligibleForReturn() != null && e.getEligibleForReturn()));
    }

    @Test
    @DisplayName("Should return empty list if no returnable entries")
    void testGetReturnableEntriesEmpty() {
        OrderEntry entry1 = OrderEntry.builder()
                .productCode("PROD-001")
                .eligibleForReturn(false)
                .build();

        order.setEntries(List.of(entry1));

        List<OrderEntry> returnableEntries = ReturnEligibilityUtil.getReturnableEntries(order);

        assertTrue(returnableEntries.isEmpty());
    }

    @Test
    @DisplayName("Should return empty list for null order")
    void testGetReturnableEntriesNullOrder() {
        List<OrderEntry> returnableEntries = ReturnEligibilityUtil.getReturnableEntries(null);

        assertTrue(returnableEntries.isEmpty());
    }

    // ======================
    // DAYS REMAINING TESTS
    // ======================

    @Test
    @DisplayName("Should calculate correct days remaining for return")
    void testGetDaysRemainingForReturn() {
        order.setPlacedDate(LocalDateTime.now().minusDays(3));

        long daysRemaining = ReturnEligibilityUtil.getDaysRemainingForReturn(order);

        assertTrue(daysRemaining >= 6 && daysRemaining <= 7, "Should have approximately 7 days remaining");
    }

    @Test
    @DisplayName("Should return 0 days remaining if deadline passed")
    void testGetDaysRemainingForReturnPassed() {
        order.setPlacedDate(LocalDateTime.now().minusDays(12));

        long daysRemaining = ReturnEligibilityUtil.getDaysRemainingForReturn(order);

        assertEquals(0, daysRemaining);
    }

    @Test
    @DisplayName("Should return 0 for null order")
    void testGetDaysRemainingForNullOrder() {
        long daysRemaining = ReturnEligibilityUtil.getDaysRemainingForReturn(null);

        assertEquals(0, daysRemaining);
    }

    // ======================
    // SUMMARY TESTS
    // ======================

    @Test
    @DisplayName("Should generate correct return eligibility summary")
    void testGetReturnEligibilitySummary() {
        OrderEntry entry1 = OrderEntry.builder()
                .productCode("PROD-001")
                .eligibleForReturn(true)
                .build();

        OrderEntry entry2 = OrderEntry.builder()
                .productCode("PROD-002")
                .eligibleForReturn(false)
                .build();

        order.setStatus("DELIVERED");
        order.setPlacedDate(LocalDateTime.now().minusDays(5));
        order.setEntries(List.of(entry1, entry2));

        ReturnEligibilityUtil.ReturnEligibilitySummary summary = 
                ReturnEligibilityUtil.getReturnEligibilitySummary(order);

        assertTrue(summary.isOrderEligible());
        assertEquals(1, summary.getReturnableItemCount());
        assertEquals(2, summary.getTotalItemCount());
        assertTrue(summary.getDaysRemainingForReturn() > 0);
        assertFalse(summary.canReturnAllItems());
        assertTrue(summary.hasReturnableItems());
        assertEquals(1, summary.getNonReturnableItemCount());
    }

    @Test
    @DisplayName("Should indicate canReturnAllItems when all items are returnable")
    void testCanReturnAllItems() {
        OrderEntry entry1 = OrderEntry.builder()
                .productCode("PROD-001")
                .eligibleForReturn(true)
                .build();

        OrderEntry entry2 = OrderEntry.builder()
                .productCode("PROD-002")
                .eligibleForReturn(true)
                .build();

        order.setStatus("DELIVERED");
        order.setPlacedDate(LocalDateTime.now().minusDays(5));
        order.setEntries(List.of(entry1, entry2));

        ReturnEligibilityUtil.ReturnEligibilitySummary summary = 
                ReturnEligibilityUtil.getReturnEligibilitySummary(order);

        assertTrue(summary.canReturnAllItems());
    }

    @Test
    @DisplayName("Should respect custom return window in summary")
    void testSummaryWithCustomReturnWindow() {
        order.setStatus("DELIVERED");
        order.setPlacedDate(LocalDateTime.now().minusDays(15));
        order.setEntries(List.of(entry));

        ReturnEligibilityUtil.ReturnEligibilitySummary summary = 
                ReturnEligibilityUtil.getReturnEligibilitySummary(order, 20);

        assertTrue(summary.isOrderEligible());
        assertTrue(summary.getDaysRemainingForReturn() > 0);
        assertEquals(20, summary.getReturnWindowDays());
    }

    // ======================
    // EDGE CASES
    // ======================

    @Test
    @DisplayName("Should handle order with no entries")
    void testOrderWithNoEntries() {
        order.setEntries(new ArrayList<>());

        ReturnEligibilityUtil.ReturnEligibilitySummary summary = 
                ReturnEligibilityUtil.getReturnEligibilitySummary(order);

        assertEquals(0, summary.getTotalItemCount());
        assertEquals(0, summary.getReturnableItemCount());
        assertFalse(summary.hasReturnableItems());
    }

    @Test
    @DisplayName("Should handle case-insensitive status comparison")
    void testStatusCaseInsensitive() {
        order.setStatus("delivered");
        order.setPlacedDate(LocalDateTime.now().minusDays(5));

        assertTrue(ReturnEligibilityUtil.isOrderEligibleForReturn(order));

        order.setStatus("DELIVERED");
        assertTrue(ReturnEligibilityUtil.isOrderEligibleForReturn(order));

        order.setStatus("Delivered");
        assertTrue(ReturnEligibilityUtil.isOrderEligibleForReturn(order));
    }
}

