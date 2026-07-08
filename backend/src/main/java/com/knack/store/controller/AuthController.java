package com.knack.store.controller;

import com.knack.store.dto.AuthDTO;
import com.knack.store.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register and log in to obtain a JWT (public)")
@SecurityRequirements
public class AuthController {

    private final CustomerService customerService;

    @PostMapping("/register")
    @Operation(summary = "Register", description = "Create a new customer account and return a JWT.")
    public ResponseEntity<AuthDTO.AuthResponse> register(@Valid @RequestBody AuthDTO.RegisterRequest request) {
        return ResponseEntity.ok(customerService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate with email and password and return a JWT.")
    public ResponseEntity<AuthDTO.AuthResponse> login(@Valid @RequestBody AuthDTO.LoginRequest request) {
        return ResponseEntity.ok(customerService.login(request));
    }
}
