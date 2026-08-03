package com.knack.store.controller;

import com.knack.store.dto.SavedCartDTO;
import com.knack.store.service.SavedCartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/saved-carts")
@RequiredArgsConstructor
@Tag(name = "Saved Carts", description = "Manage snapshot carts for the authenticated customer")
public class SavedCartController {

    private final SavedCartService savedCartService;

    @PostMapping
    @Operation(summary = "Save active cart", description = "Creates a snapshot of the active cart with a user-defined name, or updates an existing saved cart when targetSavedCartId is provided.")
    public ResponseEntity<SavedCartDTO.SavedCartDetail> saveCurrentCart(@AuthenticationPrincipal UserDetails user,
                                                                         @RequestBody SavedCartDTO.SaveCartRequest request) {
        return ResponseEntity.ok(savedCartService.saveCurrentCart(user.getUsername(), request));
    }

    @GetMapping
    @Operation(summary = "List saved carts", description = "Returns all saved carts for current customer in newest-first order.")
    public ResponseEntity<List<SavedCartDTO.SavedCartSummary>> getSavedCarts(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(savedCartService.getSavedCarts(user.getUsername()));
    }

    @GetMapping("/{savedCartId}")
    @Operation(summary = "Get saved cart detail", description = "Returns detailed entries for a specific saved cart.")
    public ResponseEntity<SavedCartDTO.SavedCartDetail> getSavedCart(@AuthenticationPrincipal UserDetails user,
                                                                      @PathVariable Long savedCartId) {
        return ResponseEntity.ok(savedCartService.getSavedCartDetail(user.getUsername(), savedCartId));
    }

    @DeleteMapping("/{savedCartId}")
    @Operation(summary = "Delete saved cart", description = "Deletes a saved cart snapshot.")
    public ResponseEntity<Void> deleteSavedCart(@AuthenticationPrincipal UserDetails user,
                                                @PathVariable Long savedCartId) {
        savedCartService.deleteSavedCart(user.getUsername(), savedCartId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{savedCartId}/entries/{entryId}")
    @Operation(summary = "Remove saved cart entry", description = "Removes one product entry from saved cart.")
    public ResponseEntity<SavedCartDTO.SavedCartDetail> removeEntry(@AuthenticationPrincipal UserDetails user,
                                                                     @PathVariable Long savedCartId,
                                                                     @PathVariable Long entryId) {
        return ResponseEntity.ok(savedCartService.removeEntry(user.getUsername(), savedCartId, entryId));
    }

    @PostMapping("/{savedCartId}/add-to-cart")
    @Operation(summary = "Add all to active cart", description = "Adds available items from saved cart to active cart and reports unavailable ones.")
    public ResponseEntity<SavedCartDTO.AddSavedCartToCartResponse> addAllToCart(@AuthenticationPrincipal UserDetails user,
                                                                                 @PathVariable Long savedCartId) {
        return ResponseEntity.ok(savedCartService.addAllToActiveCart(user.getUsername(), savedCartId));
    }
}
