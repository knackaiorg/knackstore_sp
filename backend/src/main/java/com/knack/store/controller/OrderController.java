package com.knack.store.controller;

import com.knack.store.dto.OrderDTO;
import com.knack.store.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Place and review the authenticated customer's orders (requires JWT)")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Place order", description = "Create an order for the current customer from their cart / request payload.")
    public ResponseEntity<OrderDTO> placeOrder(@AuthenticationPrincipal UserDetails user,
                                               @RequestBody OrderDTO.PlaceOrderRequest request) {
        return ResponseEntity.ok(orderService.placeOrder(user.getUsername(), request));
    }

    @GetMapping
    @Operation(summary = "Get order history", description = "Returns all orders placed by the current customer.")
    public ResponseEntity<List<OrderDTO>> getOrders(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(orderService.getOrderHistory(user.getUsername()));
    }

    @GetMapping("/{orderCode}")
    @Operation(summary = "Get order by code", description = "Fetch a single order belonging to the current customer by its order code.")
    public ResponseEntity<OrderDTO> getOrder(@AuthenticationPrincipal UserDetails user,
                                              @PathVariable String orderCode) {
        return ResponseEntity.ok(orderService.getOrderByCode(user.getUsername(), orderCode));
    }
}
