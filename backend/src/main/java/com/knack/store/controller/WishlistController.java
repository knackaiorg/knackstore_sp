package com.knack.store.controller;

import com.knack.store.dto.WishlistDTO;
import com.knack.store.service.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
@Tag(name = "Wishlist", description = "Manage the authenticated customer's wishlist (requires JWT)")
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    @Operation(summary = "Get wishlist", description = "Returns the current customer's wishlist with all entries.")
    public ResponseEntity<WishlistDTO> getWishlist(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(wishlistService.getWishlist(user.getUsername()));
    }

    @PostMapping("/toggle")
    @Operation(summary = "Toggle wishlist entry", description = "Adds item to wishlist if absent, removes if already present.")
    public ResponseEntity<WishlistDTO> toggleEntry(@AuthenticationPrincipal UserDetails user,
                                                   @RequestBody WishlistDTO.ToggleEntryRequest request) {
        return ResponseEntity.ok(wishlistService.toggleEntry(user.getUsername(), request));
    }

    @DeleteMapping("/entries/{entryId}")
    @Operation(summary = "Remove wishlist entry", description = "Removes a wishlist entry by id.")
    public ResponseEntity<WishlistDTO> removeEntry(@AuthenticationPrincipal UserDetails user,
                                                   @PathVariable Long entryId) {
        return ResponseEntity.ok(wishlistService.removeEntry(user.getUsername(), entryId));
    }

    @PostMapping("/entries/{entryId}/move-to-cart")
    @Operation(summary = "Move entry to cart", description = "Moves wishlist item to cart and removes it from wishlist.")
    public ResponseEntity<WishlistDTO> moveToCart(@AuthenticationPrincipal UserDetails user,
                                                  @PathVariable Long entryId) {
        return ResponseEntity.ok(wishlistService.moveEntryToCart(user.getUsername(), entryId));
    }
}
