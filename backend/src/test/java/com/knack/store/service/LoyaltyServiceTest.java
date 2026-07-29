package com.knack.store.service;

import com.knack.store.dto.LoyaltyDTO;
import com.knack.store.model.*;
import com.knack.store.repository.CartRepository;
import com.knack.store.repository.CustomerRepository;
import com.knack.store.repository.LoyaltyAccountRepository;
import com.knack.store.repository.LoyaltyTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Covers LoyaltyService against the Task 03 discovery-session requirements:
 *
 *  - REQ-1/REQ-2: earn 1 point per $1, credited immediately and finally at order
 *    placement ("calculateEarnedPoints_*", "recordEarnedPoints_*")
 *  - REQ-3: redeem 1 point = $1 off ("redeemPoints_success_*")
 *  - REQ-4: minimum 10-point redemption, including the exact boundary
 *    ("redeemPoints_belowMinimum_*", "redeemPoints_exactlyMinimum_*")
 *  - REQ-5: dual cap (balance, subtotal), including the "full payment via points"
 *    case explicitly called out in the latest requirements
 *    ("redeemPoints_exceedsBalance_*", "redeemPoints_exceedsSubtotal_*",
 *    "redeemPoints_fullPayment_*")
 *  - Returns/cancellations: there is deliberately no code path anywhere in this
 *    class that reacts to order status, so no reversal test is possible or
 *    needed -- its absence *is* the requirement.
 *
 * @Value fields are populated manually via ReflectionTestUtils since plain
 * Mockito unit tests never go through Spring's property injection.
 */
@ExtendWith(MockitoExtension.class)
class LoyaltyServiceTest {

    @Mock private LoyaltyAccountRepository loyaltyAccountRepository;
    @Mock private LoyaltyTransactionRepository loyaltyTransactionRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private CartRepository cartRepository;

    @InjectMocks
    private LoyaltyService loyaltyService;

    @Captor private ArgumentCaptor<LoyaltyAccount> accountCaptor;
    @Captor private ArgumentCaptor<LoyaltyTransaction> transactionCaptor;
    @Captor private ArgumentCaptor<Cart> cartCaptor;

    private Customer customer;

    @BeforeEach
    void setUp() {
        // Mirrors application.properties: 1 point per $1 earned, 1 point = $1 off, 10-point minimum.
        ReflectionTestUtils.setField(loyaltyService, "earnRateDivisor", 1.0);
        ReflectionTestUtils.setField(loyaltyService, "redeemPointsPerRupee", 1.0);
        ReflectionTestUtils.setField(loyaltyService, "minRedeemPoints", 10);

        customer = Customer.builder().id(1L).email("jane@example.com").firstName("Jane").lastName("Doe").build();
    }

    private LoyaltyAccount accountWithBalance(int balance) {
        return LoyaltyAccount.builder()
                .id(100L).customer(customer)
                .pointsBalance(balance).lifetimePointsEarned(balance).lifetimePointsRedeemed(0)
                .lastModifiedDate(LocalDateTime.now())
                .build();
    }

    private Cart cartWithSubtotal(double subtotal) {
        CartEntry entry = CartEntry.builder().quantity(1).unitPrice(subtotal).build();
        return Cart.builder().id(500L).customer(customer)
                .entries(new java.util.ArrayList<>(List.of(entry)))
                .redeemedPoints(0).pointsDiscountAmount(0.0)
                .build();
    }

    // ---------- REQ-1 / REQ-2: earning ----------

    @Test
    void calculateEarnedPoints_oneDollarPerPoint_flooredForFractionalCents() {
        assertThat(loyaltyService.calculateEarnedPoints(49.99)).isEqualTo(49);
        assertThat(loyaltyService.calculateEarnedPoints(50.00)).isEqualTo(50);
    }

    @Test
    void calculateEarnedPoints_zeroOrNegativeSpend_earnsNothing() {
        assertThat(loyaltyService.calculateEarnedPoints(0)).isZero();
        assertThat(loyaltyService.calculateEarnedPoints(-25.0)).isZero();
    }

    @Test
    void recordEarnedPoints_newCustomer_createsAccountAndLogsEarnedTransactionLinkedToOrder() {
        when(loyaltyAccountRepository.findByCustomerId(1L)).thenReturn(Optional.empty());
        when(loyaltyAccountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        loyaltyService.recordEarnedPoints(customer, "ORD-ABC123", 75);

        verify(loyaltyAccountRepository, times(2)).save(accountCaptor.capture());
        LoyaltyAccount finalState = accountCaptor.getAllValues().get(accountCaptor.getAllValues().size() - 1);
        assertThat(finalState.getPointsBalance()).isEqualTo(75);
        assertThat(finalState.getLifetimePointsEarned()).isEqualTo(75);

        verify(loyaltyTransactionRepository).save(transactionCaptor.capture());
        LoyaltyTransaction txn = transactionCaptor.getValue();
        assertThat(txn.getType()).isEqualTo(LoyaltyTransaction.Type.EARNED);
        assertThat(txn.getPoints()).isEqualTo(75);
        assertThat(txn.getOrderCode()).isEqualTo("ORD-ABC123");
    }

    @Test
    void recordEarnedPoints_existingAccount_addsToBalanceRatherThanReplacing() {
        LoyaltyAccount existing = accountWithBalance(30);
        when(loyaltyAccountRepository.findByCustomerId(1L)).thenReturn(Optional.of(existing));

        loyaltyService.recordEarnedPoints(customer, "ORD-XYZ999", 20);

        assertThat(existing.getPointsBalance()).isEqualTo(50);
        assertThat(existing.getLifetimePointsEarned()).isEqualTo(50);
    }

    @Test
    void recordEarnedPoints_zeroPoints_isANoOpThatTouchesNoRepository() {
        loyaltyService.recordEarnedPoints(customer, "ORD-ZERO", 0);

        verifyNoInteractions(loyaltyAccountRepository, loyaltyTransactionRepository);
    }

    // ---------- REQ-3/REQ-4/REQ-5: redemption ----------

    @Test
    void redeemPoints_success_deductsBalanceImmediatelyAndAppliesDiscountToCart() {
        Cart cart = cartWithSubtotal(100.0);
        LoyaltyAccount account = accountWithBalance(50);
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(cart));
        when(loyaltyAccountRepository.findByCustomerId(1L)).thenReturn(Optional.of(account));

        LoyaltyDTO.RedeemResponse response = loyaltyService.redeemPoints("jane@example.com", 20);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getDiscountAmount()).isEqualTo(20.0);
        assertThat(response.getRemainingBalance()).isEqualTo(30);
        assertThat(account.getPointsBalance()).isEqualTo(30);
        assertThat(account.getLifetimePointsRedeemed()).isEqualTo(20);

        verify(loyaltyTransactionRepository).save(transactionCaptor.capture());
        assertThat(transactionCaptor.getValue().getType()).isEqualTo(LoyaltyTransaction.Type.REDEEMED);
        assertThat(transactionCaptor.getValue().getPoints()).isEqualTo(-20);

        verify(cartRepository).save(cartCaptor.capture());
        assertThat(cartCaptor.getValue().getRedeemedPoints()).isEqualTo(20);
        assertThat(cartCaptor.getValue().getPointsDiscountAmount()).isEqualTo(20.0);
    }

    @Test
    void redeemPoints_emptyCart_rejectedWithoutTouchingBalance() {
        Cart cart = Cart.builder().id(500L).customer(customer).entries(new java.util.ArrayList<>()).build();
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(cart));
        when(loyaltyAccountRepository.findByCustomerId(1L)).thenReturn(Optional.of(accountWithBalance(50)));

        LoyaltyDTO.RedeemResponse response = loyaltyService.redeemPoints("jane@example.com", 20);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("empty");
        verify(loyaltyAccountRepository, never()).save(any());
    }

    @Test
    void redeemPoints_alreadyRedeemedOnThisCart_mustBeRemovedFirst() {
        Cart cart = cartWithSubtotal(100.0);
        cart.setRedeemedPoints(15);
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(cart));
        when(loyaltyAccountRepository.findByCustomerId(1L)).thenReturn(Optional.of(accountWithBalance(50)));

        LoyaltyDTO.RedeemResponse response = loyaltyService.redeemPoints("jane@example.com", 20);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("already redeemed");
    }

    @Test
    void redeemPoints_nullRedeemedPointsOnFreshCart_isTreatedAsNotYetRedeemed() {
        // A brand-new cart has redeemedPoints == null (never set), not 0 -- guards the null-safety branch.
        Cart cart = Cart.builder().id(500L).customer(customer)
                .entries(new java.util.ArrayList<>(List.of(CartEntry.builder().quantity(1).unitPrice(100.0).build())))
                .redeemedPoints(null).build();
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(cart));
        when(loyaltyAccountRepository.findByCustomerId(1L)).thenReturn(Optional.of(accountWithBalance(50)));

        LoyaltyDTO.RedeemResponse response = loyaltyService.redeemPoints("jane@example.com", 20);

        assertThat(response.isSuccess()).isTrue();
    }

    @Test
    void redeemPoints_zeroOrNegativePoints_rejected() {
        Cart cart = cartWithSubtotal(100.0);
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(cart));
        when(loyaltyAccountRepository.findByCustomerId(1L)).thenReturn(Optional.of(accountWithBalance(50)));

        assertThat(loyaltyService.redeemPoints("jane@example.com", 0).isSuccess()).isFalse();
        assertThat(loyaltyService.redeemPoints("jane@example.com", -5).isSuccess()).isFalse();
    }

    @Test
    void redeemPoints_belowMinimumOfTen_rejected() {
        Cart cart = cartWithSubtotal(100.0);
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(cart));
        when(loyaltyAccountRepository.findByCustomerId(1L)).thenReturn(Optional.of(accountWithBalance(50)));

        LoyaltyDTO.RedeemResponse response = loyaltyService.redeemPoints("jane@example.com", 9);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("at least 10 points");
    }

    @Test
    void redeemPoints_exactlyMinimumOfTen_boundaryIsInclusiveAndSucceeds() {
        Cart cart = cartWithSubtotal(100.0);
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(cart));
        when(loyaltyAccountRepository.findByCustomerId(1L)).thenReturn(Optional.of(accountWithBalance(50)));

        LoyaltyDTO.RedeemResponse response = loyaltyService.redeemPoints("jane@example.com", 10);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getDiscountAmount()).isEqualTo(10.0);
    }

    @Test
    void redeemPoints_exceedsAvailableBalance_rejected() {
        Cart cart = cartWithSubtotal(100.0);
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(cart));
        when(loyaltyAccountRepository.findByCustomerId(1L)).thenReturn(Optional.of(accountWithBalance(15)));

        LoyaltyDTO.RedeemResponse response = loyaltyService.redeemPoints("jane@example.com", 20);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("don't have enough points");
    }

    @Test
    void redeemPoints_exceedsOrderSubtotal_rejectedWithMaxRedeemableHint() {
        Cart cart = cartWithSubtotal(15.0); // subtotal smaller than requested redemption
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(cart));
        when(loyaltyAccountRepository.findByCustomerId(1L)).thenReturn(Optional.of(accountWithBalance(100)));

        LoyaltyDTO.RedeemResponse response = loyaltyService.redeemPoints("jane@example.com", 20);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("15 points").contains("$15.00");
        // Balance must be untouched on rejection.
        verify(loyaltyAccountRepository, never()).save(any());
    }

    @Test
    void redeemPoints_fullPaymentExactlyCoveringSubtotal_isAllowed() {
        // The explicit "full payment using points" requirement: subtotal == redemption value, not greater.
        Cart cart = cartWithSubtotal(50.0);
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(cart));
        when(loyaltyAccountRepository.findByCustomerId(1L)).thenReturn(Optional.of(accountWithBalance(60)));

        LoyaltyDTO.RedeemResponse response = loyaltyService.redeemPoints("jane@example.com", 50);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getDiscountAmount()).isEqualTo(50.0);
        assertThat(cart.getTotalPrice()).isEqualTo(0.0); // fully covered by points
    }

    // ---------- Removing a redemption before checkout ----------

    @Test
    void removeRedeemedPoints_nothingRedeemed_rejected() {
        Cart cart = cartWithSubtotal(100.0); // redeemedPoints defaults to 0
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(cart));

        LoyaltyDTO.RedeemResponse response = loyaltyService.removeRedeemedPoints("jane@example.com");

        assertThat(response.isSuccess()).isFalse();
        verifyNoInteractions(loyaltyAccountRepository);
    }

    @Test
    void removeRedeemedPoints_refundsPointsAndResetsCart() {
        Cart cart = cartWithSubtotal(100.0);
        cart.setRedeemedPoints(20);
        cart.setPointsDiscountAmount(20.0);
        LoyaltyAccount account = accountWithBalance(30); // already deducted at apply-time
        account.setLifetimePointsRedeemed(20);
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(cartRepository.findByCustomerId(1L)).thenReturn(Optional.of(cart));
        when(loyaltyAccountRepository.findByCustomerId(1L)).thenReturn(Optional.of(account));

        LoyaltyDTO.RedeemResponse response = loyaltyService.removeRedeemedPoints("jane@example.com");

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getRemainingBalance()).isEqualTo(50);
        assertThat(account.getPointsBalance()).isEqualTo(50);
        assertThat(account.getLifetimePointsRedeemed()).isZero();
        assertThat(cart.getRedeemedPoints()).isZero();
        assertThat(cart.getPointsDiscountAmount()).isEqualTo(0.0);

        verify(loyaltyTransactionRepository).save(transactionCaptor.capture());
        assertThat(transactionCaptor.getValue().getType()).isEqualTo(LoyaltyTransaction.Type.REFUNDED);
        assertThat(transactionCaptor.getValue().getPoints()).isEqualTo(20);
    }

    // ---------- Cart-mutation safety net (add/update/remove entry) ----------

    @Test
    void releaseReservedPointsIfAny_nothingRedeemed_isANoOp() {
        Cart cart = cartWithSubtotal(100.0);

        loyaltyService.releaseReservedPointsIfAny(cart);

        verifyNoInteractions(loyaltyAccountRepository, loyaltyTransactionRepository, cartRepository);
    }

    @Test
    void releaseReservedPointsIfAny_hasRedemption_refundsBeforeCartChangeInvalidatesTheCap() {
        Cart cart = cartWithSubtotal(100.0);
        cart.setRedeemedPoints(15);
        cart.setPointsDiscountAmount(15.0);
        LoyaltyAccount account = accountWithBalance(10);
        when(loyaltyAccountRepository.findByCustomerId(1L)).thenReturn(Optional.of(account));

        loyaltyService.releaseReservedPointsIfAny(cart);

        assertThat(account.getPointsBalance()).isEqualTo(25);
        assertThat(cart.getRedeemedPoints()).isZero();
        assertThat(cart.getPointsDiscountAmount()).isEqualTo(0.0);
        verify(cartRepository).save(cart);
    }

    // ---------- Balance / history for the Profile page ----------

    @Test
    void getBalance_mapsAccountAndComputesRedeemableValueAtOneToOneRate() {
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(loyaltyAccountRepository.findByCustomerId(1L)).thenReturn(Optional.of(accountWithBalance(42)));

        LoyaltyDTO.BalanceResponse balance = loyaltyService.getBalance("jane@example.com");

        assertThat(balance.getPointsBalance()).isEqualTo(42);
        assertThat(balance.getRedeemableValue()).isEqualTo(42.0);
        assertThat(balance.getMinRedeemPoints()).isEqualTo(10);
        assertThat(balance.getPointValue()).isEqualTo(1.0);
    }

    @Test
    void getBalance_newCustomerWithNoAccountYet_returnsZero() {
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(loyaltyAccountRepository.findByCustomerId(1L)).thenReturn(Optional.empty());
        when(loyaltyAccountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        LoyaltyDTO.BalanceResponse balance = loyaltyService.getBalance("jane@example.com");

        assertThat(balance.getPointsBalance()).isZero();
    }

    @Test
    void getHistory_mapsTransactionsInRepositoryOrder_eachLinkedToItsOrder() {
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        LoyaltyAccount account = accountWithBalance(30);
        when(loyaltyAccountRepository.findByCustomerId(1L)).thenReturn(Optional.of(account));

        LoyaltyTransaction redeemed = LoyaltyTransaction.builder()
                .id(2L).account(account).type(LoyaltyTransaction.Type.REDEEMED).points(-20)
                .description("Redeemed against cart checkout").createdDate(LocalDateTime.now()).build();
        LoyaltyTransaction earned = LoyaltyTransaction.builder()
                .id(1L).account(account).type(LoyaltyTransaction.Type.EARNED).points(50)
                .orderCode("ORD-ABC123").description("Earned from order ORD-ABC123")
                .createdDate(LocalDateTime.now().minusDays(1)).build();
        when(loyaltyTransactionRepository.findByAccountIdOrderByCreatedDateDesc(100L))
                .thenReturn(List.of(redeemed, earned));

        List<LoyaltyDTO.TransactionDTO> history = loyaltyService.getHistory("jane@example.com");

        assertThat(history).hasSize(2);
        assertThat(history.get(0).getType()).isEqualTo(LoyaltyTransaction.Type.REDEEMED);
        assertThat(history.get(1).getType()).isEqualTo(LoyaltyTransaction.Type.EARNED);
        assertThat(history.get(1).getOrderCode()).isEqualTo("ORD-ABC123");
    }

    @Test
    void getHistory_noActivityYet_returnsEmptyList() {
        when(customerRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(customer));
        when(loyaltyAccountRepository.findByCustomerId(1L)).thenReturn(Optional.of(accountWithBalance(0)));
        when(loyaltyTransactionRepository.findByAccountIdOrderByCreatedDateDesc(100L)).thenReturn(List.of());

        assertThat(loyaltyService.getHistory("jane@example.com")).isEmpty();
    }
}
