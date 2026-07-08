package com.knack.store.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public class AuthDTO {

    @Data
    public static class RegisterRequest {
        @NotBlank @Email
        private String email;
        @NotBlank
        private String password;
        @NotBlank
        private String firstName;
        @NotBlank
        private String lastName;
        private String phone;
    }

    @Data
    public static class LoginRequest {
        @NotBlank @Email
        private String email;
        @NotBlank
        private String password;
    }

    @Data
    public static class AuthResponse {
        private Long customerId;
        private String token;
        private String email;
        private String firstName;
        private String lastName;

        public AuthResponse(Long customerId, String token, String email, String firstName, String lastName) {
            this.customerId = customerId;
            this.token = token;
            this.email = email;
            this.firstName = firstName;
            this.lastName = lastName;
        }
    }
}
