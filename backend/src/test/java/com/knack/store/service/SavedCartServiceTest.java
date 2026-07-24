package com.knack.store.service;

import com.knack.store.dto.SavedCartDTO;
import com.knack.store.model.Cart;
import com.knack.store.model.CartEntry;
import com.knack.store.model.Customer;
import com.knack.store.model.Product;
import com.knack.store.repository.CartRepository;
import com.knack.store.repository.CustomerRepository;
import com.knack.store.repository.SavedCartEntryRepository;
import com.knack.store.repository.SavedCartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class SavedCartServiceTest {

    @Mock
    private SavedCartRepository savedCartRepository;

    @Mock
    private SavedCartEntryRepository savedCartEntryRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private StockService stockService;

    @InjectMocks
    private SavedCartService savedCartService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void saveCurrentCart_snapshotsEntriesAndTotals() {
        Customer customer = Customer.builder().id(7L).email("user@example.com").build();
        Cart cart = Cart.builder().id(11L).customer(customer).build();
        Product product = Product.builder().id(1L).name("Laptop").basePrice(1000.0).build();
        CartEntry entry = CartEntry.builder()
                .id(44L)
                .cart(cart)
                .product(product)
                .quantity(2)
                .unitPrice(1000.0)
                .build();
        cart.setEntries(List.of(entry));

        when(customerRepository.findByEmail("user@example.com")).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerId(7L)).thenReturn(Optional.of(cart));
        when(savedCartRepository.save(any())).thenAnswer(invocation -> {
            Object entity = invocation.getArgument(0);
            if (entity instanceof com.knack.store.model.SavedCart savedCart) {
                savedCart.setId(20L);
            }
            return entity;
        });

        SavedCartDTO savedCart = savedCartService.saveCurrentCart("user@example.com");

        assertThat(savedCart.getCartNumber()).isEqualTo("SC-20");
        assertThat(savedCart.getSkuCount()).isEqualTo(1);
        assertThat(savedCart.getTotalPrice()).isEqualTo(2000.0);
        assertThat(savedCart.getEntries()).hasSize(1);
        assertThat(savedCart.getEntries().get(0).getUnitPrice()).isEqualTo(1000.0);
    }
}
