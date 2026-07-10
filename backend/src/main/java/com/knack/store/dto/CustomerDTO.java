package com.knack.store.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CustomerDTO {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;

    @Data
    public static class UpdateProfileRequest {
        private String firstName;
        private String lastName;
        private String phone;
    }

    @Data
    public static class CreateAddressRequest {
        private String firstName;
        private String lastName;
        private String line1;
        private String line2;
        private String city;
        private String state;
        private String postcode;
        private String country;
        private String phone;
    }
}
