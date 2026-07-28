package com.knack.store.controller;

import com.knack.store.dto.LoyaltyDTO;
import com.knack.store.service.LoyaltyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/loyalty")
@RequiredArgsConstructor
@Tag(name = "Loyalty Points", description = "Rewards points balance, history, and cart redemption (requires JWT)")
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    @GetMapping("/balance")
    @Operation(summary = "Get points balance", description = "Returns the current customer's rewards points balance and redemption rules.")
    public ResponseEntity<LoyaltyDTO.BalanceResponse> getBalance(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(loyaltyService.getBalance(user.getUsername()));
    }

    @GetMapping("/history")
    @Operation(summary = "Get points history", description = "Returns the current customer's rewards points transaction history.")
    public ResponseEntity<LoyaltyDTO.HistoryResponse> getHistory(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(LoyaltyDTO.HistoryResponse.builder()
                .transactions(loyaltyService.getHistory(user.getUsername()))
                .build());
    }

    @PostMapping("/redeem")
    @Operation(summary = "Redeem points", description = "Apply rewards points as a discount on the current cart.")
    public ResponseEntity<LoyaltyDTO.RedeemResponse> redeemPoints(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody LoyaltyDTO.RedeemRequest request) {
        return ResponseEntity.ok(loyaltyService.redeemPoints(user.getUsername(), request.getPoints()));
    }

    @DeleteMapping("/redeem")
    @Operation(summary = "Remove redeemed points", description = "Remove currently redeemed points from the cart and return them to the balance.")
    public ResponseEntity<LoyaltyDTO.RedeemResponse> removeRedeemedPoints(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(loyaltyService.removeRedeemedPoints(user.getUsername()));
    }
}
