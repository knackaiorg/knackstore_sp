package com.knack.store.dto;

import com.knack.store.model.LoyaltyTransaction;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class LoyaltyDTO {

    @Data
    @Builder
    public static class BalanceResponse {
        private int pointsBalance;
        private double redeemableValue;
        private int lifetimePointsEarned;
        private int lifetimePointsRedeemed;
        private int minRedeemPoints;
        private double pointValue;
    }

    @Data
    @Builder
    public static class TransactionDTO {
        private Long id;
        private LoyaltyTransaction.Type type;
        private int points;
        private String orderCode;
        private String description;
        private LocalDateTime createdDate;
    }

    @Data
    public static class RedeemRequest {
        private int points;
    }

    @Data
    @Builder
    public static class RedeemResponse {
        private boolean success;
        private String message;
        private int pointsRedeemed;
        private Double discountAmount;
        private int remainingBalance;
    }

    @Data
    @Builder
    public static class HistoryResponse {
        private List<TransactionDTO> transactions;
    }
}
