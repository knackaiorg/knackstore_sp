package com.knack.store.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knack.store.dto.LoyaltyDTO;
import com.knack.store.model.LoyaltyTransaction;
import com.knack.store.security.JwtAuthFilter;
import com.knack.store.service.LoyaltyService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers the loyalty REST surface (balance, history, redeem, remove-redemption)
 * used by the cart widget and the Profile page.
 */
@WebMvcTest(LoyaltyController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(username = "jane@example.com")
class LoyaltyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private LoyaltyService loyaltyService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    private LoyaltyDTO.BalanceResponse sampleBalance() {
        return LoyaltyDTO.BalanceResponse.builder()
                .pointsBalance(42)
                .redeemableValue(42.0)
                .lifetimePointsEarned(90)
                .lifetimePointsRedeemed(48)
                .minRedeemPoints(10)
                .pointValue(1.0)
                .build();
    }

    @Test
    void getBalance_returnsCurrentBalanceForAuthenticatedCustomer() throws Exception {
        when(loyaltyService.getBalance("jane@example.com")).thenReturn(sampleBalance());

        mockMvc.perform(get("/api/loyalty/balance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pointsBalance").value(42))
                .andExpect(jsonPath("$.minRedeemPoints").value(10))
                .andExpect(jsonPath("$.pointValue").value(1.0));
    }

    @Test
    void getHistory_returnsTransactionsLinkedToOrders() throws Exception {
        LoyaltyDTO.TransactionDTO earned = LoyaltyDTO.TransactionDTO.builder()
                .id(1L).type(LoyaltyTransaction.Type.EARNED).points(50)
                .orderCode("ORD-ABC123").description("Earned from order ORD-ABC123")
                .createdDate(LocalDateTime.now()).build();
        when(loyaltyService.getHistory("jane@example.com")).thenReturn(List.of(earned));

        mockMvc.perform(get("/api/loyalty/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transactions.length()").value(1))
                .andExpect(jsonPath("$.transactions[0].type").value("EARNED"))
                .andExpect(jsonPath("$.transactions[0].orderCode").value("ORD-ABC123"));
    }

    @Test
    void getHistory_noActivityYet_returnsEmptyArray() throws Exception {
        when(loyaltyService.getHistory("jane@example.com")).thenReturn(List.of());

        mockMvc.perform(get("/api/loyalty/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transactions.length()").value(0));
    }

    @Test
    void redeemPoints_success_returns200WithDiscountApplied() throws Exception {
        LoyaltyDTO.RedeemRequest request = new LoyaltyDTO.RedeemRequest();
        request.setPoints(20);
        LoyaltyDTO.RedeemResponse response = LoyaltyDTO.RedeemResponse.builder()
                .success(true).message("Points applied successfully")
                .pointsRedeemed(20).discountAmount(20.0).remainingBalance(22)
                .build();
        when(loyaltyService.redeemPoints(eq("jane@example.com"), eq(20))).thenReturn(response);

        mockMvc.perform(post("/api/loyalty/redeem")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.discountAmount").value(20.0))
                .andExpect(jsonPath("$.remainingBalance").value(22));
    }

    @Test
    void redeemPoints_belowMinimum_returns200WithSuccessFalseAndMessage() throws Exception {
        // Business-rule failures are 200 + success:false, not an HTTP error status --
        // the endpoint always returns a decision, not an exception.
        LoyaltyDTO.RedeemRequest request = new LoyaltyDTO.RedeemRequest();
        request.setPoints(5);
        LoyaltyDTO.RedeemResponse response = LoyaltyDTO.RedeemResponse.builder()
                .success(false).message("You need to redeem at least 10 points")
                .pointsRedeemed(0).discountAmount(0.0).remainingBalance(0)
                .build();
        when(loyaltyService.redeemPoints(eq("jane@example.com"), eq(5))).thenReturn(response);

        mockMvc.perform(post("/api/loyalty/redeem")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("You need to redeem at least 10 points"));
    }

    @Test
    void removeRedeemedPoints_success_returnsRefundedBalance() throws Exception {
        LoyaltyDTO.RedeemResponse response = LoyaltyDTO.RedeemResponse.builder()
                .success(true).message("Points removed and returned to your balance")
                .pointsRedeemed(0).discountAmount(0.0).remainingBalance(42)
                .build();
        when(loyaltyService.removeRedeemedPoints("jane@example.com")).thenReturn(response);

        mockMvc.perform(delete("/api/loyalty/redeem"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.remainingBalance").value(42));
    }

    @Test
    void removeRedeemedPoints_nothingToRemove_returns200WithSuccessFalse() throws Exception {
        LoyaltyDTO.RedeemResponse response = LoyaltyDTO.RedeemResponse.builder()
                .success(false).message("No points are currently redeemed on this cart")
                .pointsRedeemed(0).discountAmount(0.0).remainingBalance(0)
                .build();
        when(loyaltyService.removeRedeemedPoints("jane@example.com")).thenReturn(response);

        mockMvc.perform(delete("/api/loyalty/redeem"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false));
    }
}
