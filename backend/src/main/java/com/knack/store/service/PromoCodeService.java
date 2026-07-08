package com.knack.store.service;

import com.knack.store.dto.PromoCodeDTO;
import com.knack.store.model.Cart;
import com.knack.store.model.PromoCode;
import com.knack.store.repository.CartRepository;
import com.knack.store.repository.PromoCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PromoCodeService {

    private final PromoCodeRepository promoCodeRepository;
    private final CartRepository cartRepository;
    private final CartService cartService;

    @Transactional
    public PromoCodeDTO.ApplyResponse applyPromoCode(String email, String code) {
        Cart cart = cartService.getOrCreateCart(email);

        // Check if a code is already applied
        if (cart.getAppliedPromoCode() != null) {
            return PromoCodeDTO.ApplyResponse.builder()
                    .success(false)
                    .message("A promo code is already applied. Please remove it before applying a new one.")
                    .build();
        }

        // Validate promo code exists and is active
        PromoCode promoCode = promoCodeRepository.findByCodeIgnoreCaseAndActiveTrue(code)
                .orElse(null);

        if (promoCode == null) {
            return PromoCodeDTO.ApplyResponse.builder()
                    .success(false)
                    .message("This promo code is not valid")
                    .build();
        }

        double cartSubtotal = cart.getSubtotal();

        // Check minimum order amount
        if (promoCode.getMinimumOrderAmount() != null && cartSubtotal < promoCode.getMinimumOrderAmount()) {
            return PromoCodeDTO.ApplyResponse.builder()
                    .success(false)
                    .message(String.format("This code requires a minimum cart value of ₹%.2f", promoCode.getMinimumOrderAmount()))
                    .build();
        }

        // Calculate discount
        double discountAmount = promoCode.calculateDiscount(cartSubtotal);

        // Apply promo code to cart
        cart.setAppliedPromoCode(promoCode.getCode());
        cart.setDiscountAmount(discountAmount);
        cartRepository.save(cart);

        return PromoCodeDTO.ApplyResponse.builder()
                .success(true)
                .message("Promo code applied successfully")
                .code(promoCode.getCode())
                .discountAmount(discountAmount)
                .build();
    }

    @Transactional
    public PromoCodeDTO.ApplyResponse removePromoCode(String email) {
        Cart cart = cartService.getOrCreateCart(email);

        if (cart.getAppliedPromoCode() == null) {
            return PromoCodeDTO.ApplyResponse.builder()
                    .success(false)
                    .message("No promo code is currently applied")
                    .build();
        }

        cart.setAppliedPromoCode(null);
        cart.setDiscountAmount(0.0);
        cartRepository.save(cart);

        return PromoCodeDTO.ApplyResponse.builder()
                .success(true)
                .message("Promo code removed successfully")
                .build();
    }

    public PromoCodeDTO toDTO(PromoCode promoCode) {
        return PromoCodeDTO.builder()
                .id(promoCode.getId())
                .code(promoCode.getCode())
                .discountType(promoCode.getDiscountType())
                .discountValue(promoCode.getDiscountValue())
                .minimumOrderAmount(promoCode.getMinimumOrderAmount())
                .build();
    }
}
