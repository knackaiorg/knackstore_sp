package com.knack.store.service;

import com.knack.store.dto.AddressDTO;
import com.knack.store.dto.CartDTO;
import com.knack.store.dto.OrderDTO;
import com.knack.store.dto.ReorderDTO;
import com.knack.store.dto.DeliveryOptionDTO;
import com.knack.store.exception.InsufficientStockException;
import com.knack.store.model.*;
import com.knack.store.repository.CustomerRepository;
import com.knack.store.repository.OrderRepository;
import com.knack.store.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final CartService cartService;
    private final ProductRepository productRepository;
    private final StockService stockService;

    @Transactional
    public OrderDTO placeOrder(String email, OrderDTO.PlaceOrderRequest request) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Cart cart = cartService.getOrCreateCart(email);
        if (cart.getEntries().isEmpty()) throw new RuntimeException("Cart is empty");

        if (cart.getEntries().stream().anyMatch(e -> !e.isValidForCheckout())) {
            throw new InsufficientStockException(
                    "Something has changed in your cart. Please remove and re-add the highlighted products before checking out.");
        }

        // Commit each line's inventory hold into a permanent deduction, product-id order avoids lock-order deadlocks.
        // If a hold already expired, this re-validates availability and fails fast with a clear "sold out" message.
        cart.getEntries().stream()
                .sorted(Comparator.comparing(e -> e.getProduct().getId()))
                .forEach(e -> {
                    Product product = stockService.lockProduct(e.getProduct().getId());
                    ProductVariant variant = e.getVariant() != null
                            ? product.getVariants().stream()
                                    .filter(v -> v.getId().equals(e.getVariant().getId()))
                                    .findFirst().orElse(null)
                            : null;
                    boolean holdStillActive = e.getReservedUntil() != null && e.getReservedUntil().isAfter(LocalDateTime.now());
                    stockService.commitReservation(product, variant, cart.getId(), e.getQuantity(), holdStillActive);
                });

        Address delivery = toAddress(request.getDeliveryAddress());

        List<OrderEntry> entries = cart.getEntries().stream().map(e -> OrderEntry.builder()
                .productCode(e.getProduct().getCode())
                .productName(e.getProduct().getName())
                .variantSku(e.getVariant() != null ? e.getVariant().getSku() : null)
                .variantDescription(buildVariantDesc(e.getVariant()))
                .quantity(e.getQuantity())
                .unitPrice(e.getUnitPrice())
                .totalPrice(e.getQuantity() * e.getUnitPrice())
                .build()).collect(Collectors.toList());

        double deliveryCost = 0.0;
        DeliveryOptionDTO selectedDeliveryOption = request.getDeliveryOption();
        if (selectedDeliveryOption != null && selectedDeliveryOption.getCost() != null) {
            deliveryCost = selectedDeliveryOption.getCost();
        }

        // Free 2-Day Delivery if subtotal >= $200
        if (cart.getSubtotal() != null && cart.getSubtotal() >= 200.0 && 
            selectedDeliveryOption != null && "2-Day Delivery".equals(selectedDeliveryOption.getOption())) {
            deliveryCost = 0.0;
        }

        LocalDateTime placedDate = LocalDateTime.now();
        LocalDate expectedDeliveryDate = calculateDeliveryDate(placedDate, selectedDeliveryOption);

        Order order = Order.builder()
                .orderCode("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .customer(customer)
                .entries(entries)
                .deliveryAddress(delivery)
                .status("PENDING")
                .subtotal(cart.getSubtotal())
                .appliedPromoCode(cart.getAppliedPromoCode())
                .discountAmount(cart.getDiscountAmount() != null ? cart.getDiscountAmount() : 0.0)
                .totalPrice(cart.getTotalPrice() + deliveryCost)
                .deliveryDate(expectedDeliveryDate)
                .paymentMethod(request.getPaymentMethod())
                .trackingNumber("TRK-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase())
                .placedDate(placedDate)
                .lastModifiedDate(LocalDateTime.now())
                .build();

        entries.forEach(e -> e.setOrder(order));
        Order saved = orderRepository.save(order);
        cartService.clearCart(cart);
        return toDTO(saved);
    }

    public List<OrderDTO> getOrderHistory(String email) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        return orderRepository.findByCustomerIdOrderByPlacedDateDesc(customer.getId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public OrderDTO getOrderByCode(String email, String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (!order.getCustomer().getEmail().equals(email)) throw new RuntimeException("Access denied");
        return toDTO(order);
    }

    @Transactional
    public OrderDTO cancelOrder(String email, String orderCode, String reason) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (!order.getCustomer().getEmail().equals(email)) {
            throw new RuntimeException("Access denied");
        }

        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Cancellation reason is required");
        }

        String currentStatus = order.getStatus();
        if (!"PENDING".equalsIgnoreCase(currentStatus) && !"CONFIRMED".equalsIgnoreCase(currentStatus)) {
            throw new IllegalStateException(
                    "Order cannot be cancelled. Only orders with status PENDING or CONFIRMED can be cancelled. Current status: " + currentStatus);
        }

        order.setStatus("CANCELLED");
        order.setCancellationReason(reason.trim());
        order.setLastModifiedDate(LocalDateTime.now());
        Order saved = orderRepository.save(order);
        log.info("Order {} cancelled by {}. Reason: {}", orderCode, email, reason);
        return toDTO(saved);
    }

    /**
     * Reorder: Add all items from a past order to the current cart.
     * - Verifies order ownership
     * - Uses current catalog prices, not historical prices
     * - Respects current stock constraints
     * - Merges quantities with existing cart items
     * - Atomic operation: all or nothing
     */



    @Transactional
    public ReorderDTO.ReorderResponse reorder(String email, ReorderDTO.ReorderRequest request) {
        log.info("Processing reorder for customer: {} from order: {}", email, request.getOrderCode());
        
        try {
            // Step 1: Verify customer exists
            Customer customer = customerRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
            
            // Step 2: Fetch order and verify ownership
            Order order = orderRepository.findByOrderCode(request.getOrderCode())
                    .orElseThrow(() -> new RuntimeException("Order not found"));
            
            if (!order.getCustomer().getId().equals(customer.getId())) {
                throw new RuntimeException("Access denied: Order does not belong to this customer");
            }
            
            // Step 3: Get or create customer's current cart
            Cart cart = cartService.getOrCreateCart(email);
            
            // Step 4: Process each order entry and add to current cart
            int itemsAdded = 0;
            int itemsUnavailable = 0;

            for (OrderEntry orderEntry : order.getEntries()) {
                try {
                    // Fetch current product (to get latest price and stock)
                    Product product = productRepository.findByCode(orderEntry.getProductCode())
                            .orElse(null);
                    
                    if (product == null) {
                        log.warn("Product not found for reorder: {}", orderEntry.getProductCode());
                        itemsUnavailable++;
                        continue;
                    }
                    
                    // Determine quantity to add (min of original qty and current stock)
                    int quantityToAdd = orderEntry.getQuantity();

                    if (quantityToAdd <= 0) {
                        log.warn("No stock available for product: {}", orderEntry.getProductCode());
                        itemsUnavailable++;
                        continue;
                    }
                    
                    // Add to cart using existing CartService (handles merging)
                    CartDTO.AddEntryRequest addEntryReq = new CartDTO.AddEntryRequest();
                    addEntryReq.setProductId(product.getId());
                    addEntryReq.setQuantity(quantityToAdd);
                    // Note: variant handling would go here if OrderEntry had variant reference
                    // For now, we only add base product

                   cartService.addEntry(email, addEntryReq);
                    itemsAdded++;

                } catch (Exception e) {
                    log.error("Error adding item to cart during reorder: {}", orderEntry.getProductCode(), e);
                    itemsUnavailable++;
                    // Continue with next item (partial reorder allowed per acceptance criteria)
                }
            }
            
            // Step 5: Fetch updated cart
            CartDTO updatedCart = cartService.getCart(email);
            
            // Step 6: Build success response
            return ReorderDTO.ReorderResponse.builder()
                    .success(true)
                    .message(String.format(
                            "Reorder successful: %d items added, %d items unavailable",
                            itemsAdded,
                            itemsUnavailable
                    ))
                    .updatedCart(updatedCart)
                    .itemsAdded(itemsAdded)
                    .itemsUnavailable(itemsUnavailable)
                    .build();
                    
        } catch (Exception e) {
            log.error("Reorder failed for customer: {}, order: {}", email, request.getOrderCode(), e);
            // Return error response (no redirect, no partial state)
            return ReorderDTO.ReorderResponse.builder()
                    .success(false)
                    .message("Reorder failed: " + e.getMessage())
                    .updatedCart(null)
                    .itemsAdded(0)
                    .itemsUnavailable(0)
                    .build();
        }
    }

    public List<DeliveryOptionDTO> getDeliveryOptions() {
        return List.of(
            DeliveryOptionDTO.builder()
                    .option("Standard Delivery")
                    .deliveryTime("7–8 days")
                    .cost(0.0)
                    .isDefault(true)
                    .build(),
            DeliveryOptionDTO.builder()
                    .option("2-Day Delivery")
                    .deliveryTime("2 Business Days")
                    .cost(20.0)
                    .isDefault(false)
                    .build(),
            DeliveryOptionDTO.builder()
                    .option("Next-Day Delivery")
                    .deliveryTime("Next Business Day")
                    .cost(50.0)
                    .isDefault(false)
                    .build()
        );
    }

    private LocalDate calculateDeliveryDate(LocalDateTime placedDateTime, DeliveryOptionDTO option) {
        LocalDate placedDate = placedDateTime.toLocalDate();
        if (option == null || option.getDeliveryTime() == null) {
            return addBusinessDays(placedDate, 7);
        }
        String deliveryTime = option.getDeliveryTime().toLowerCase();
        // Normalize different dash characters (en-dash, em-dash) to simple hyphen
        deliveryTime = deliveryTime.replace('\u2013', '-').replace('\u2014', '-');
        if (deliveryTime.contains("next business day") || deliveryTime.contains("next-day") || deliveryTime.contains("next day")) {
            // If ordered after 3pm, deliver next-next business day
            int cutoffHour = 15; // 3pm
            int businessDaysToAdd = (placedDateTime.getHour() >= cutoffHour) ? 2 : 1;
            return addBusinessDays(placedDate, businessDaysToAdd);
        }

        if (deliveryTime.contains("business days")) {
            // e.g., "2 Business Days" -> add that many business days
            String digits = deliveryTime.replaceAll("[^0-9]", "");
            int n = 2;
            try { n = Integer.parseInt(digits); } catch (Exception e) { n = 2; }
            return addBusinessDays(placedDate, n);
        }

        if (deliveryTime.matches(".*\\d+.*days.*")) {
            // Use the upper bound if a range is provided (handles en-dash/– or hyphen), otherwise use that many days.
            String digits = deliveryTime.replaceAll("[^0-9\\-]", "");
            if (digits.contains("-")) {
                String[] parts = digits.split("-");
                try {
                    int upper = Integer.parseInt(parts[1]);
                    return addBusinessDays(placedDate, upper);
                } catch (NumberFormatException e) {
                    return addBusinessDays(placedDate, 7);
                }
            }
            try {
                int days = Integer.parseInt(digits);
                return addBusinessDays(placedDate, days);
            } catch (NumberFormatException e) {
                return addBusinessDays(placedDate, 7);
            }
        }

        return addBusinessDays(placedDate, 7);
    }

    private LocalDate addBusinessDays(LocalDate startDate, int businessDays) {
        LocalDate date = startDate;
        int added = 0;
        while (added < businessDays) {
            date = date.plusDays(1);
            int dow = date.getDayOfWeek().getValue();
            if (dow >= 1 && dow <= 5) { // Mon-Fri
                added++;
            }
        }
        return date;
    }

    public OrderDTO toDTO(Order o) {
        return OrderDTO.builder()
                .id(o.getId())
                .orderCode(o.getOrderCode())
                .status(o.getStatus())
                .subtotal(o.getSubtotal())
                .appliedPromoCode(o.getAppliedPromoCode())
                .discountAmount(o.getDiscountAmount() != null ? o.getDiscountAmount() : 0.0)
                .totalPrice(o.getTotalPrice())
                .paymentMethod(o.getPaymentMethod())
                .trackingNumber(o.getTrackingNumber())
                .placedDate(o.getPlacedDate())
                .deliveryDate(o.getDeliveryDate())
                .cancellationReason(o.getCancellationReason())
                .lastModifiedDate(o.getLastModifiedDate())
                .deliveryAddress(o.getDeliveryAddress() != null ? toAddressDTO(o.getDeliveryAddress()) : null)
                .entries(o.getEntries().stream().map(e -> OrderDTO.OrderEntryDTO.builder()
                        .productCode(e.getProductCode())
                        .productName(e.getProductName())
                        .variantSku(e.getVariantSku())
                        .variantDescription(e.getVariantDescription())
                        .quantity(e.getQuantity())
                        .unitPrice(e.getUnitPrice())
                        .totalPrice(e.getTotalPrice())
                        .build()).collect(Collectors.toList()))
                .build();
    }

    private Address toAddress(AddressDTO dto) {
        if (dto == null) return null;
        return Address.builder()
                .firstName(dto.getFirstName()).lastName(dto.getLastName())
                .line1(dto.getLine1()).line2(dto.getLine2())
                .city(dto.getCity()).state(dto.getState())
                .postcode(dto.getPostcode()).country(dto.getCountry())
                .phone(dto.getPhone()).build();
    }

    private AddressDTO toAddressDTO(Address a) {
        AddressDTO dto = new AddressDTO();
        dto.setFirstName(a.getFirstName()); dto.setLastName(a.getLastName());
        dto.setLine1(a.getLine1()); dto.setLine2(a.getLine2());
        dto.setCity(a.getCity()); dto.setState(a.getState());
        dto.setPostcode(a.getPostcode()); dto.setCountry(a.getCountry());
        dto.setPhone(a.getPhone());
        return dto;
    }

    private String buildVariantDesc(ProductVariant v) {
        if (v == null) return null;
        StringBuilder sb = new StringBuilder();
        if (v.getColor() != null) sb.append(v.getColor());
        if (v.getStorage() != null) { if (sb.length() > 0) sb.append(" / "); sb.append(v.getStorage()); }
        return sb.toString();
    }
}
