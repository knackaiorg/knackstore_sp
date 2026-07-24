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
@Tag(name = "Saved Carts", description = "Manage the authenticated customer's saved carts")
public class SavedCartController {

    private final SavedCartService savedCartService;

    @PostMapping
    @Operation(summary = "Save current cart", description = "Create a snapshot of the active cart without modifying it.")
    public ResponseEntity<SavedCartDTO> saveCurrentCart(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(savedCartService.saveCurrentCart(user.getUsername()));
    }

    @GetMapping
    @Operation(summary = "List saved carts", description = "Return a list of the customer's saved carts.")
    public ResponseEntity<List<SavedCartDTO>> listSavedCarts(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(savedCartService.listSavedCarts(user.getUsername()));
    }

    @GetMapping("/{savedCartId}")
    @Operation(summary = "Get saved cart", description = "Return the contents of a specific saved cart.")
    public ResponseEntity<SavedCartDTO> getSavedCart(@AuthenticationPrincipal UserDetails user, @PathVariable Long savedCartId) {
        return ResponseEntity.ok(savedCartService.getSavedCart(user.getUsername(), savedCartId));
    }

    @DeleteMapping("/{savedCartId}")
    @Operation(summary = "Delete saved cart", description = "Remove a saved cart and all its contents.")
    public ResponseEntity<Void> deleteSavedCart(@AuthenticationPrincipal UserDetails user, @PathVariable Long savedCartId) {
        savedCartService.deleteSavedCart(user.getUsername(), savedCartId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{savedCartId}/entries/{entryId}")
    @Operation(summary = "Remove saved cart entry", description = "Remove a single entry from a saved cart.")
    public ResponseEntity<SavedCartDTO> removeSavedCartEntry(@AuthenticationPrincipal UserDetails user,
                                                             @PathVariable Long savedCartId,
                                                             @PathVariable Long entryId) {
        return ResponseEntity.ok(savedCartService.removeSavedCartEntry(user.getUsername(), savedCartId, entryId));
    }

    @PostMapping("/{savedCartId}/add-to-cart")
    @Operation(summary = "Add saved cart to active cart", description = "Merge the saved cart items into the active cart, skipping any unavailable items.")
    public ResponseEntity<SavedCartDTO> addSavedCartToActiveCart(@AuthenticationPrincipal UserDetails user,
                                                                 @PathVariable Long savedCartId) {
        return ResponseEntity.ok(savedCartService.addSavedCartToActiveCart(user.getUsername(), savedCartId));
    }
}
