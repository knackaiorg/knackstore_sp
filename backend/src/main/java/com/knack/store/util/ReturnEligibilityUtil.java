package com.knack.store.util;

import com.knack.store.dto.OrderDTO;
import com.knack.store.model.Order;
import com.knack.store.model.OrderEntry;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Utility class for handling return eligibility calculations and checks.
 * 
 * This class provides helper methods for:
 * - Checking if an order is eligible for return
 * - Checking if an order entry is eligible for return
 * - Filtering returnable items from an order
 * - Generating return eligibility reports
 */
public class ReturnEligibilityUtil {

    /**
     * Default return window in days
     */
    public static final int DEFAULT_RETURN_WINDOW_DAYS = 10;

    /**
     * Checks if an order is eligible for return based on:
     * 1. Order status must be "DELIVERED"
     * 2. Order must have been placed within the return window (default: 10 days)
     *
     * @param order the order to check
     * @return true if order is eligible for return, false otherwise
     */
    public static boolean isOrderEligibleForReturn(Order order) {
        return isOrderEligibleForReturn(order, DEFAULT_RETURN_WINDOW_DAYS);
    }

    /**
     * Checks if an order is eligible for return with a custom return window.
     *
     * @param order the order to check
     * @param returnWindowDays the number of days within which an order can be returned
     * @return true if order is eligible for return, false otherwise
     */
    public static boolean isOrderEligibleForReturn(Order order, int returnWindowDays) {
        if (order == null) {
            return false;
        }

        // Check order status
        if (order.getStatus() == null || !order.getStatus().equalsIgnoreCase("PLACED")) {
            return false;
        }

        // Check if placed date exists
        if (order.getPlacedDate() == null) {
            return false;
        }

        // Check if order is within the return window
        LocalDateTime returnDeadline = LocalDateTime.now().minusDays(returnWindowDays);
        return order.getPlacedDate().isAfter(returnDeadline);
    }

    /**
     * Checks if an order entry is eligible for return.
     * An entry is returnable if its eligibleForReturn flag is true.
     *
     * @param entry the order entry to check
     * @return true if entry is eligible for return, false otherwise
     */
    public static boolean isEntryEligibleForReturn(OrderEntry entry) {
        if (entry == null) {
            return false;
        }
        return entry.getEligibleForReturn() == null || entry.getEligibleForReturn();
    }

    /**
     * Checks if an order DTO is eligible for return.
     *
     * @param orderDTO the order DTO to check
     * @return true if order DTO indicates eligibility for return
     */
    public static boolean isDTOEligibleForReturn(OrderDTO orderDTO) {
        if (orderDTO == null) {
            return false;
        }
        return orderDTO.getEligibleForReturn() != null && orderDTO.getEligibleForReturn();
    }

    /**
     * Checks if an order entry DTO is eligible for return.
     *
     * @param entryDTO the order entry DTO to check
     * @return true if entry DTO indicates eligibility for return
     */
    public static boolean isEntryDTOEligibleForReturn(OrderDTO.OrderEntryDTO entryDTO) {
        if (entryDTO == null) {
            return false;
        }
        return entryDTO.getEligibleForReturn() != null && entryDTO.getEligibleForReturn();
    }

    /**
     * Filters returnable entries from an order.
     *
     * @param order the order containing entries
     * @return list of returnable order entries
     */
    public static List<OrderEntry> getReturnableEntries(Order order) {
        if (order == null || order.getEntries() == null) {
            return List.of();
        }
        return order.getEntries().stream()
                .filter(ReturnEligibilityUtil::isEntryEligibleForReturn)
                .collect(Collectors.toList());
    }

    /**
     * Filters returnable entries from an order DTO.
     *
     * @param orderDTO the order DTO containing entries
     * @return list of returnable order entry DTOs
     */
    public static List<OrderDTO.OrderEntryDTO> getReturnableEntriesFromDTO(OrderDTO orderDTO) {
        if (orderDTO == null || orderDTO.getEntries() == null) {
            return List.of();
        }
        return orderDTO.getEntries().stream()
                .filter(ReturnEligibilityUtil::isEntryDTOEligibleForReturn)
                .collect(Collectors.toList());
    }

    /**
     * Calculates the number of days remaining for return eligibility.
     * Returns 0 if order is not eligible or deadline has passed.
     *
     * @param order the order to check
     * @return number of days remaining for return, or 0 if expired
     */
    public static long getDaysRemainingForReturn(Order order) {
        return getDaysRemainingForReturn(order, DEFAULT_RETURN_WINDOW_DAYS);
    }

    /**
     * Calculates the number of days remaining for return eligibility with custom window.
     *
     * @param order the order to check
     * @param returnWindowDays the return window in days
     * @return number of days remaining for return, or 0 if expired
     */
    public static long getDaysRemainingForReturn(Order order, int returnWindowDays) {
        if (order == null || order.getPlacedDate() == null) {
            return 0;
        }

        LocalDateTime returnDeadline = order.getPlacedDate().plusDays(returnWindowDays);
        LocalDateTime now = LocalDateTime.now();

        if (now.isAfter(returnDeadline)) {
            return 0;
        }

        return java.time.temporal.ChronoUnit.DAYS.between(now, returnDeadline);
    }

    /**
     * Generates a return eligibility summary for an order.
     *
     * @param order the order to analyze
     * @return a summary object with return eligibility details
     */
    public static ReturnEligibilitySummary getReturnEligibilitySummary(Order order) {
        return getReturnEligibilitySummary(order, DEFAULT_RETURN_WINDOW_DAYS);
    }

    /**
     * Generates a return eligibility summary for an order with custom window.
     *
     * @param order the order to analyze
     * @param returnWindowDays the return window in days
     * @return a summary object with return eligibility details
     */
    public static ReturnEligibilitySummary getReturnEligibilitySummary(Order order, int returnWindowDays) {
        boolean isOrderEligible = isOrderEligibleForReturn(order, returnWindowDays);
        List<OrderEntry> returnableEntries = getReturnableEntries(order);
        long daysRemaining = getDaysRemainingForReturn(order, returnWindowDays);

        return ReturnEligibilitySummary.builder()
                .orderEligible(isOrderEligible)
                .returnableItemCount(returnableEntries.size())
                .totalItemCount(order != null && order.getEntries() != null ? order.getEntries().size() : 0)
                .daysRemainingForReturn(daysRemaining)
                .returnWindowDays(returnWindowDays)
                .build();
    }

    /**
     * Generates a return eligibility summary for an order DTO.
     *
     * @param orderDTO the order DTO to analyze
     * @return a summary object with return eligibility details
     */
    public static ReturnEligibilitySummary getReturnEligibilitySummaryFromDTO(OrderDTO orderDTO) {
        return getReturnEligibilitySummaryFromDTO(orderDTO, DEFAULT_RETURN_WINDOW_DAYS);
    }

    /**
     * Generates a return eligibility summary for an order DTO with custom window.
     *
     * @param orderDTO the order DTO to analyze
     * @param returnWindowDays the return window in days
     * @return a summary object with return eligibility details
     */
    public static ReturnEligibilitySummary getReturnEligibilitySummaryFromDTO(OrderDTO orderDTO, int returnWindowDays) {
        boolean isOrderEligible = isDTOEligibleForReturn(orderDTO);
        List<OrderDTO.OrderEntryDTO> returnableEntries = getReturnableEntriesFromDTO(orderDTO);
        
        // For DTO, we cannot calculate days remaining without placedDate
        long daysRemaining = orderDTO != null && orderDTO.getPlacedDate() != null
                ? java.time.temporal.ChronoUnit.DAYS.between(LocalDateTime.now(), 
                  orderDTO.getPlacedDate().plusDays(returnWindowDays))
                : 0;

        return ReturnEligibilitySummary.builder()
                .orderEligible(isOrderEligible)
                .returnableItemCount(returnableEntries.size())
                .totalItemCount(orderDTO != null && orderDTO.getEntries() != null ? orderDTO.getEntries().size() : 0)
                .daysRemainingForReturn(Math.max(0, daysRemaining))
                .returnWindowDays(returnWindowDays)
                .build();
    }

    /**
     * Summary class for return eligibility information
     */
    public static class ReturnEligibilitySummary {
        private final boolean orderEligible;
        private final int returnableItemCount;
        private final int totalItemCount;
        private final long daysRemainingForReturn;
        private final int returnWindowDays;

        public ReturnEligibilitySummary(boolean orderEligible, int returnableItemCount, int totalItemCount,
                                       long daysRemainingForReturn, int returnWindowDays) {
            this.orderEligible = orderEligible;
            this.returnableItemCount = returnableItemCount;
            this.totalItemCount = totalItemCount;
            this.daysRemainingForReturn = daysRemainingForReturn;
            this.returnWindowDays = returnWindowDays;
        }

        public static Builder builder() {
            return new Builder();
        }

        public boolean isOrderEligible() {
            return orderEligible;
        }

        public int getReturnableItemCount() {
            return returnableItemCount;
        }

        public int getTotalItemCount() {
            return totalItemCount;
        }

        public long getDaysRemainingForReturn() {
            return daysRemainingForReturn;
        }

        public int getReturnWindowDays() {
            return returnWindowDays;
        }

        public boolean hasReturnableItems() {
            return returnableItemCount > 0;
        }

        public boolean canReturnAllItems() {
            return returnableItemCount == totalItemCount && totalItemCount > 0;
        }

        public int getNonReturnableItemCount() {
            return totalItemCount - returnableItemCount;
        }

        @Override
        public String toString() {
            return "ReturnEligibilitySummary{" +
                    "orderEligible=" + orderEligible +
                    ", returnableItemCount=" + returnableItemCount +
                    ", totalItemCount=" + totalItemCount +
                    ", daysRemainingForReturn=" + daysRemainingForReturn +
                    ", returnWindowDays=" + returnWindowDays +
                    '}';
        }

        public static class Builder {
            private boolean orderEligible;
            private int returnableItemCount;
            private int totalItemCount;
            private long daysRemainingForReturn;
            private int returnWindowDays;

            public Builder orderEligible(boolean orderEligible) {
                this.orderEligible = orderEligible;
                return this;
            }

            public Builder returnableItemCount(int returnableItemCount) {
                this.returnableItemCount = returnableItemCount;
                return this;
            }

            public Builder totalItemCount(int totalItemCount) {
                this.totalItemCount = totalItemCount;
                return this;
            }

            public Builder daysRemainingForReturn(long daysRemainingForReturn) {
                this.daysRemainingForReturn = daysRemainingForReturn;
                return this;
            }

            public Builder returnWindowDays(int returnWindowDays) {
                this.returnWindowDays = returnWindowDays;
                return this;
            }

            public ReturnEligibilitySummary build() {
                return new ReturnEligibilitySummary(orderEligible, returnableItemCount, totalItemCount,
                        daysRemainingForReturn, returnWindowDays);
            }
        }
    }
}

