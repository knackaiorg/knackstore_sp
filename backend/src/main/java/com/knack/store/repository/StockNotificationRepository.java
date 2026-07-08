package com.knack.store.repository;
import com.knack.store.model.StockNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface StockNotificationRepository extends JpaRepository<StockNotification, Long> {
    Optional<StockNotification> findByUserIdAndSku(Long userId, String sku);

    @Query("SELECT sn FROM StockNotification sn WHERE sn.email = :email ORDER BY sn.subscribedAt DESC")
    List<StockNotification> findAllByEmail(@Param("email") String email);

    @Query(value = "SELECT * FROM STOCK_NOTIFICATION WHERE EMAIL = :email ORDER BY SUBSCRIBED_AT DESC", nativeQuery = true)
    List<StockNotification> findByEmailOrderBySubscribedAtDesc(@Param("email") String email);

    // Delete a notification only if both id and email match. Returns number of rows deleted (0 or 1).
    @Modifying
    @Query("DELETE FROM StockNotification sn WHERE sn.id = :id AND sn.email = :email")
    int deleteByIdAndEmail(@Param("id") Long id, @Param("email") String email);
}
