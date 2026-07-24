package com.knack.store.controller;

import com.knack.store.dto.AddAllToCartResponse;
import com.knack.store.dto.QuickOrderCsvUploadResponse;
import com.knack.store.dto.QuickOrderSearchResponse;
import com.knack.store.service.QuickOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/quick-order")
@RequiredArgsConstructor
@Tag(name = "Quick Order", description = "Bulk/Quick order via CSV upload")
public class QuickOrderController {

    private final QuickOrderService quickOrderService;

    @PostMapping(value = "/upload-csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload CSV for quick order",
            description = "Accepts a two-column CSV (SKU, Quantity). Parses and returns a staging list of valid items and errors.")
    public ResponseEntity<QuickOrderCsvUploadResponse> uploadCsv(
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".csv")) {
            return ResponseEntity.badRequest().build();
        }

        QuickOrderCsvUploadResponse response = quickOrderService.processCsvUpload(file);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/staging/{sessionId}")
    @Operation(summary = "Get staging list", description = "Retrieve the staging list for a given upload session.")
    public ResponseEntity<QuickOrderCsvUploadResponse> getStagingList(
            @PathVariable String sessionId) {
        return ResponseEntity.ok(quickOrderService.getStagingList(sessionId));
    }

    @PostMapping("/add-all-to-cart/{sessionId}")
    @Operation(summary = "Add all staging items to cart",
            description = "Re-verifies stock for all staging items and adds valid ones to the customer's cart. " +
                    "Items that went out of stock remain in the staging list with an error message.")
    public ResponseEntity<AddAllToCartResponse> addAllToCart(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String sessionId) {
        AddAllToCartResponse response = quickOrderService.addAllToCart(sessionId, user.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    @Operation(summary = "Search products for quick order",
            description = "Auto-complete search by product name or SKU. Returns stock status so out-of-stock items can be blocked from selection.")
    public ResponseEntity<QuickOrderSearchResponse> searchProducts(@RequestParam("q") String query) {
        return ResponseEntity.ok(quickOrderService.searchProducts(query));
    }

    @GetMapping("/download-template")
    @Operation(summary = "Download CSV template", description = "Download a sample CSV template for quick order.")
    public ResponseEntity<byte[]> downloadTemplate() {
        try {
            Resource resource = new ClassPathResource("files/QuickOrder_Template.csv");
            Path path = Paths.get(resource.getURI());
            byte[] data = Files.readAllBytes(path);

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=QuickOrder_Template.csv");

            return new ResponseEntity<>(data, headers, HttpStatus.OK);
        } catch (IOException e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}