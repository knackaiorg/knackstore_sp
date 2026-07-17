package com.knack.store.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CustomerAddressDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String line1;
    private String line2;
    private String city;
    private String state;
    private String postcode;
    private String country;
    private String phone;
    private boolean defaultAddress;

    /**
     * Body for both create (POST) and update (PUT) requests. {@code makeDefault}
     * is a request from the customer to mark this entry default; it is
     * deliberately optional and separate from {@code isDefault} on the response
     * DTO above -- the server, not the client, is the source of truth for which
     * single address ends up flagged default (see CustomerAddressService).
     */
    @Data
    public static class SaveAddressRequest {
        @NotBlank(message = "First name is required")
        private String firstName;

        @NotBlank(message = "Last name is required")
        private String lastName;

        @NotBlank(message = "Address line 1 is required")
        private String line1;

        private String line2;

        @NotBlank(message = "City is required")
        private String city;

        @NotBlank(message = "State is required")
        private String state;

        @NotBlank(message = "Postal code is required")
        private String postcode;

        @NotBlank(message = "Country is required")
        private String country;

        @NotBlank(message = "Phone is required")
        private String phone;

        private boolean makeDefault;
    }
}
