package com.knack.store.controller;

import com.knack.store.dto.PromoCodeDTO;
import com.knack.store.service.PromoCodeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/promo-codes")
@RequiredArgsConstructor
@Tag(name = "Promo Codes", description = "Apply and manage promo codes for cart discounts (requires JWT)")
public class PromoCodeController {

    private final PromoCodeService promoCodeService;

    @PostMapping("/apply")
    @Operation(summary = "Apply promo code", description = "Apply a promo code to the current cart")
    public ResponseEntity<PromoCodeDTO.ApplyResponse> applyPromoCode(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody PromoCodeDTO.ApplyRequest request) {
        PromoCodeDTO.ApplyResponse response = promoCodeService.applyPromoCode(user.getUsername(), request.getCode());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/remove")
    @Operation(summary = "Remove promo code", description = "Remove the currently applied promo code from the cart")
    public ResponseEntity<PromoCodeDTO.ApplyResponse> removePromoCode(
            @AuthenticationPrincipal UserDetails user) {
        PromoCodeDTO.ApplyResponse response = promoCodeService.removePromoCode(user.getUsername());
        return ResponseEntity.ok(response);
    }
}
