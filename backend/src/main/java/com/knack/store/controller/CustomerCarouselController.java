package com.knack.store.controller;

import com.knack.store.dto.CustomerCarouselDTO;
import com.knack.store.service.CustomerCarouselService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/carousel")
@RequiredArgsConstructor
@Tag(name = "Customer Carousel", description = "Store and fetch product codes for FE carousel")
@SecurityRequirements
public class CustomerCarouselController {

    private CustomerCarouselService customerCarouselService;

    @PostMapping("/track")
    @Operation(summary = "Track a customer product visit", description = "Create customer row if absent, otherwise append productId to existing customer list.")
    public ResponseEntity<CustomerCarouselDTO.CarouselResponse> track(@RequestBody CustomerCarouselDTO.TrackRequest request) {
        return ResponseEntity.ok(customerCarouselService.trackProduct(request));
    }

    @GetMapping("/{customerId}")
    @Operation(summary = "Get carousel data by customer", description = "Fetch stored productId list for the given customerId.")
    public ResponseEntity<CustomerCarouselDTO.CarouselResponse> getByCustomer(@PathVariable String customerId) {
        return ResponseEntity.ok(customerCarouselService.getByCustomerId(customerId));
    }
}
