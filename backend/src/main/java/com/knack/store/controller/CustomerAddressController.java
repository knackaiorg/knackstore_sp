package com.knack.store.controller;

import com.knack.store.dto.CustomerAddressDTO;
import com.knack.store.service.CustomerAddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers/me/addresses")
@RequiredArgsConstructor
@Tag(name = "Address Book", description = "Manage the authenticated customer's saved delivery addresses (requires JWT)")
public class CustomerAddressController {

    private final CustomerAddressService addressService;

    @GetMapping
    @Operation(summary = "List saved addresses", description = "Returns every saved address for the current customer, default first.")
    public ResponseEntity<List<CustomerAddressDTO>> getAddresses(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(addressService.getAddresses(user.getUsername()));
    }

    @PostMapping
    @Operation(summary = "Add address", description = "Save a new address to the current customer's address book.")
    public ResponseEntity<CustomerAddressDTO> addAddress(@AuthenticationPrincipal UserDetails user,
                                                         @Valid @RequestBody CustomerAddressDTO.SaveAddressRequest request) {
        return ResponseEntity.ok(addressService.addAddress(user.getUsername(), request));
    }

    @PutMapping("/{addressId}")
    @Operation(summary = "Update address", description = "Edit a saved address. Does not affect delivery addresses already recorded on past orders.")
    public ResponseEntity<CustomerAddressDTO> updateAddress(@AuthenticationPrincipal UserDetails user,
                                                            @PathVariable Long addressId,
                                                            @Valid @RequestBody CustomerAddressDTO.SaveAddressRequest request) {
        return ResponseEntity.ok(addressService.updateAddress(user.getUsername(), addressId, request));
    }

    @DeleteMapping("/{addressId}")
    @Operation(summary = "Delete address", description = "Remove a saved address. If it was the default, the next remaining address (if any) becomes default.")
    public ResponseEntity<Void> deleteAddress(@AuthenticationPrincipal UserDetails user, @PathVariable Long addressId) {
        addressService.deleteAddress(user.getUsername(), addressId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{addressId}/default")
    @Operation(summary = "Set default address", description = "Marks the given saved address as default; this is what pre-fills at checkout.")
    public ResponseEntity<CustomerAddressDTO> setDefault(@AuthenticationPrincipal UserDetails user, @PathVariable Long addressId) {
        return ResponseEntity.ok(addressService.setDefault(user.getUsername(), addressId));
    }
}
