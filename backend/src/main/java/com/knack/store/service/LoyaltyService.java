package com.knack.store.service;

import com.knack.store.dto.LoyaltyDTO;
import com.knack.store.model.Cart;
import com.knack.store.model.Customer;
import com.knack.store.model.LoyaltyAccount;
import com.knack.store.model.LoyaltyTransaction;
import com.knack.store.repository.CartRepository;
import com.knack.store.repository.CustomerRepository;
import com.knack.store.repository.LoyaltyAccountRepository;
import com.knack.store.repository.LoyaltyTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * LoyaltyService
 * Core rewards-points engine: earning, redeeming, and history.
 *
 * Rules, per the Task 03 discovery session (configurable via application.properties):
 * - Earn: 1 point for every {app.loyalty.earn-rate-divisor} spent, credited immediately and
 *   finally the moment an order is placed (no delivery gating, no reversal on cancellation).
 * - Redeem: {app.loyalty.redeem-points-per-rupee} points = 1 unit of currency off, applied
 *   optionally at checkout.
 * - A minimum of {app.loyalty.min-redeem-points} points is required to redeem.
 * - A redemption can never exceed the order subtotal, nor the customer's available balance.
 *
 * Note: this service intentionally does NOT depend on CartService (it talks to CartRepository /
 * CustomerRepository directly) so that CartService can safely depend on LoyaltyService (to release
 * a reserved redemption whenever the cart contents change) without creating a circular bean dependency.
 */
@Service
@RequiredArgsConstructor
public class LoyaltyService {

    private final LoyaltyAccountRepository loyaltyAccountRepository;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final CustomerRepository customerRepository;
    private final CartRepository cartRepository;

    @Value("${app.loyalty.earn-rate-divisor:1}")
    private double earnRateDivisor; // 1 point per this many currency units spent

    @Value("${app.loyalty.redeem-points-per-rupee:1}")
    private double redeemPointsPerRupee; // this many points = 1 currency unit off

    @Value("${app.loyalty.min-redeem-points:10}")
    private int minRedeemPoints;

    // ---------- Balance / history ----------

    @Transactional
    public LoyaltyDTO.BalanceResponse getBalance(String email) {
        LoyaltyAccount account = getOrCreateAccount(findCustomer(email));
        return LoyaltyDTO.BalanceResponse.builder()
                .pointsBalance(account.getPointsBalance())
                .redeemableValue(pointsToValue(account.getPointsBalance()))
                .lifetimePointsEarned(account.getLifetimePointsEarned())
                .lifetimePointsRedeemed(account.getLifetimePointsRedeemed())
                .minRedeemPoints(minRedeemPoints)
                .pointValue(1.0 / redeemPointsPerRupee)
                .build();
    }

    public List<LoyaltyDTO.TransactionDTO> getHistory(String email) {
        LoyaltyAccount account = getOrCreateAccount(findCustomer(email));
        return loyaltyTransactionRepository.findByAccountIdOrderByCreatedDateDesc(account.getId())
                .stream()
                .map(t -> LoyaltyDTO.TransactionDTO.builder()
                        .id(t.getId())
                        .type(t.getType())
                        .points(t.getPoints())
                        .orderCode(t.getOrderCode())
                        .description(t.getDescription())
                        .createdDate(t.getCreatedDate())
                        .build())
                .collect(Collectors.toList());
    }

    // ---------- Redeem points against the cart ----------

    @Transactional
    public LoyaltyDTO.RedeemResponse redeemPoints(String email, int pointsToRedeem) {
        Customer customer = findCustomer(email);
        Cart cart = getOrCreateCart(customer);
        LoyaltyAccount account = getOrCreateAccount(customer);

        if (cart.getEntries().isEmpty()) {
            return failure("Your cart is empty");
        }

        if (cart.getRedeemedPoints() != null && cart.getRedeemedPoints() > 0) {
            return failure("Points are already redeemed on this cart. Remove them before redeeming again.");
        }

        if (pointsToRedeem <= 0) {
            return failure("Enter a positive number of points to redeem");
        }

        if (pointsToRedeem < minRedeemPoints) {
            return failure(String.format("You need to redeem at least %d points", minRedeemPoints));
        }

        if (pointsToRedeem > account.getPointsBalance()) {
            return failure("You don't have enough points for this redemption");
        }

        // Cap: points can never cover more than the order subtotal (on top of the balance check above).
        double subtotal = cart.getSubtotal();
        double discount = pointsToValue(pointsToRedeem);
        if (discount > subtotal) {
            int maxPoints = valueToPoints(subtotal);
            return failure(String.format(
                    "You can redeem at most %d points ($%.2f) on this order", maxPoints, subtotal));
        }

        // Reserve the points immediately: deduct from balance now, refunded if the redemption
        // is removed or the cart changes before checkout, made permanent once the order is placed.
        account.setPointsBalance(account.getPointsBalance() - pointsToRedeem);
        account.setLifetimePointsRedeemed(account.getLifetimePointsRedeemed() + pointsToRedeem);
        account.setLastModifiedDate(LocalDateTime.now());
        loyaltyAccountRepository.save(account);

        loyaltyTransactionRepository.save(LoyaltyTransaction.builder()
                .account(account)
                .type(LoyaltyTransaction.Type.REDEEMED)
                .points(-pointsToRedeem)
                .description("Redeemed against cart checkout")
                .createdDate(LocalDateTime.now())
                .build());

        cart.setRedeemedPoints(pointsToRedeem);
        cart.setPointsDiscountAmount(discount);
        cartRepository.save(cart);

        return LoyaltyDTO.RedeemResponse.builder()
                .success(true)
                .message("Points applied successfully")
                .pointsRedeemed(pointsToRedeem)
                .discountAmount(discount)
                .remainingBalance(account.getPointsBalance())
                .build();
    }

    @Transactional
    public LoyaltyDTO.RedeemResponse removeRedeemedPoints(String email) {
        Customer customer = findCustomer(email);
        Cart cart = getOrCreateCart(customer);

        if (cart.getRedeemedPoints() == null || cart.getRedeemedPoints() == 0) {
            return failure("No points are currently redeemed on this cart");
        }

        int refunded = refundCartPoints(cart);

        return LoyaltyDTO.RedeemResponse.builder()
                .success(true)
                .message("Points removed and returned to your balance")
                .pointsRedeemed(0)
                .discountAmount(0.0)
                .remainingBalance(refunded)
                .build();
    }

    /**
     * Called by CartService whenever the cart contents change (add/update/remove entry), since the
     * redemption cap and discount were computed against a subtotal that's no longer valid.
     * Silently no-ops if nothing is redeemed.
     */
    @Transactional
    public void releaseReservedPointsIfAny(Cart cart) {
        if (cart.getRedeemedPoints() != null && cart.getRedeemedPoints() > 0) {
            refundCartPoints(cart);
        }
    }

    private int refundCartPoints(Cart cart) {
        int points = cart.getRedeemedPoints() != null ? cart.getRedeemedPoints() : 0;
        if (points > 0 && cart.getCustomer() != null) {
            LoyaltyAccount account = getOrCreateAccount(cart.getCustomer());
            account.setPointsBalance(account.getPointsBalance() + points);
            account.setLifetimePointsRedeemed(account.getLifetimePointsRedeemed() - points);
            account.setLastModifiedDate(LocalDateTime.now());
            loyaltyAccountRepository.save(account);

            loyaltyTransactionRepository.save(LoyaltyTransaction.builder()
                    .account(account)
                    .type(LoyaltyTransaction.Type.REFUNDED)
                    .points(points)
                    .description("Redemption removed / cart changed before checkout")
                    .createdDate(LocalDateTime.now())
                    .build());
        }

        cart.setRedeemedPoints(0);
        cart.setPointsDiscountAmount(0.0);
        cartRepository.save(cart);

        LoyaltyAccount account = getOrCreateAccount(cart.getCustomer());
        return account.getPointsBalance();
    }

    // ---------- Earning ----------

    public int calculateEarnedPoints(double amountSpent) {
        if (amountSpent <= 0) return 0;
        return (int) Math.floor(amountSpent / earnRateDivisor);
    }

    @Transactional
    public void recordEarnedPoints(Customer customer, String orderCode, int points) {
        if (points <= 0) return;
        LoyaltyAccount account = getOrCreateAccount(customer);
        account.setPointsBalance(account.getPointsBalance() + points);
        account.setLifetimePointsEarned(account.getLifetimePointsEarned() + points);
        account.setLastModifiedDate(LocalDateTime.now());
        loyaltyAccountRepository.save(account);

        loyaltyTransactionRepository.save(LoyaltyTransaction.builder()
                .account(account)
                .type(LoyaltyTransaction.Type.EARNED)
                .points(points)
                .orderCode(orderCode)
                .description("Earned from order " + orderCode)
                .createdDate(LocalDateTime.now())
                .build());
    }

    // ---------- Helpers ----------

    private double pointsToValue(int points) {
        return points / redeemPointsPerRupee;
    }

    private int valueToPoints(double value) {
        return (int) Math.floor(value * redeemPointsPerRupee);
    }

    private LoyaltyAccount getOrCreateAccount(Customer customer) {
        return loyaltyAccountRepository.findByCustomerId(customer.getId())
                .orElseGet(() -> loyaltyAccountRepository.save(
                        LoyaltyAccount.builder()
                                .customer(customer)
                                .pointsBalance(0)
                                .lifetimePointsEarned(0)
                                .lifetimePointsRedeemed(0)
                                .lastModifiedDate(LocalDateTime.now())
                                .build()));
    }

    private Customer findCustomer(String email) {
        return customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
    }

    private Cart getOrCreateCart(Customer customer) {
        return cartRepository.findByCustomerId(customer.getId())
                .orElseGet(() -> cartRepository.save(Cart.builder().customer(customer).build()));
    }

    private LoyaltyDTO.RedeemResponse failure(String message) {
        return LoyaltyDTO.RedeemResponse.builder()
                .success(false)
                .message(message)
                .pointsRedeemed(0)
                .discountAmount(0.0)
                .remainingBalance(0)
                .build();
    }
}
