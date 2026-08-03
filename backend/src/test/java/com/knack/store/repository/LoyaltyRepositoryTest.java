package com.knack.store.repository;

import com.knack.store.model.Customer;
import com.knack.store.model.LoyaltyAccount;
import com.knack.store.model.LoyaltyTransaction;
import com.knack.store.model.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Exercises the loyalty repositories against a real (in-memory H2) JPA context,
 * since their derived-query method names are the part unit tests with mocks
 * can't actually verify.
 */
@DataJpaTest
class LoyaltyRepositoryTest {

    @Autowired private LoyaltyAccountRepository loyaltyAccountRepository;
    @Autowired private LoyaltyTransactionRepository loyaltyTransactionRepository;
    @Autowired private CustomerRepository customerRepository;

    private Customer persistCustomer(String email) {
        return customerRepository.save(Customer.builder()
                .email(email).password("hashed").firstName("Jane").lastName("Doe")
                .role(UserRole.CUSTOMER).build());
    }

    @Test
    void findByCustomerId_returnsTheAccountBelongingToThatCustomer() {
        Customer customer = persistCustomer("jane@example.com");
        loyaltyAccountRepository.save(LoyaltyAccount.builder()
                .customer(customer).pointsBalance(75).lifetimePointsEarned(75)
                .lifetimePointsRedeemed(0).lastModifiedDate(LocalDateTime.now()).build());

        Optional<LoyaltyAccount> found = loyaltyAccountRepository.findByCustomerId(customer.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getPointsBalance()).isEqualTo(75);
    }

    @Test
    void findByCustomerId_noAccountYet_returnsEmpty() {
        Customer customer = persistCustomer("new@example.com");

        Optional<LoyaltyAccount> found = loyaltyAccountRepository.findByCustomerId(customer.getId());

        assertThat(found).isEmpty();
    }

    @Test
    void findByCustomerEmail_looksUpAcrossTheCustomerRelationship() {
        Customer customer = persistCustomer("lookup@example.com");
        loyaltyAccountRepository.save(LoyaltyAccount.builder()
                .customer(customer).pointsBalance(10).lifetimePointsEarned(10)
                .lifetimePointsRedeemed(0).lastModifiedDate(LocalDateTime.now()).build());

        Optional<LoyaltyAccount> found = loyaltyAccountRepository.findByCustomerEmail("lookup@example.com");

        assertThat(found).isPresent();
        assertThat(found.get().getCustomer().getId()).isEqualTo(customer.getId());
    }

    @Test
    void findByAccountId_returnsTransactionsNewestFirst_eachLinkedToItsOrder() throws InterruptedException {
        Customer customer = persistCustomer("history@example.com");
        LoyaltyAccount account = loyaltyAccountRepository.save(LoyaltyAccount.builder()
                .customer(customer).pointsBalance(30).lifetimePointsEarned(50)
                .lifetimePointsRedeemed(20).lastModifiedDate(LocalDateTime.now()).build());

        LoyaltyTransaction earned = loyaltyTransactionRepository.save(LoyaltyTransaction.builder()
                .account(account).type(LoyaltyTransaction.Type.EARNED).points(50)
                .orderCode("ORD-FIRST").description("Earned from order ORD-FIRST")
                .createdDate(LocalDateTime.now().minusMinutes(5)).build());
        LoyaltyTransaction redeemed = loyaltyTransactionRepository.save(LoyaltyTransaction.builder()
                .account(account).type(LoyaltyTransaction.Type.REDEEMED).points(-20)
                .description("Redeemed against cart checkout")
                .createdDate(LocalDateTime.now()).build());

        List<LoyaltyTransaction> history = loyaltyTransactionRepository
                .findByAccountIdOrderByCreatedDateDesc(account.getId());

        assertThat(history).hasSize(2);
        assertThat(history.get(0).getId()).isEqualTo(redeemed.getId()); // most recent first
        assertThat(history.get(1).getId()).isEqualTo(earned.getId());
        assertThat(history.get(1).getOrderCode()).isEqualTo("ORD-FIRST"); // linked back to the order
    }

    @Test
    void findByAccountId_differentAccount_doesNotLeakOtherCustomersTransactions() {
        Customer customerA = persistCustomer("a@example.com");
        Customer customerB = persistCustomer("b@example.com");
        LoyaltyAccount accountA = loyaltyAccountRepository.save(LoyaltyAccount.builder()
                .customer(customerA).pointsBalance(10).lifetimePointsEarned(10)
                .lifetimePointsRedeemed(0).lastModifiedDate(LocalDateTime.now()).build());
        LoyaltyAccount accountB = loyaltyAccountRepository.save(LoyaltyAccount.builder()
                .customer(customerB).pointsBalance(99).lifetimePointsEarned(99)
                .lifetimePointsRedeemed(0).lastModifiedDate(LocalDateTime.now()).build());
        loyaltyTransactionRepository.save(LoyaltyTransaction.builder()
                .account(accountB).type(LoyaltyTransaction.Type.EARNED).points(99)
                .orderCode("ORD-B").createdDate(LocalDateTime.now()).build());

        List<LoyaltyTransaction> historyForA = loyaltyTransactionRepository
                .findByAccountIdOrderByCreatedDateDesc(accountA.getId());

        assertThat(historyForA).isEmpty();
    }
}
